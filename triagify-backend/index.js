// 1. Importar as ferramentas
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('./authMiddleware');
const verifyAdmin = require('./adminMiddleware');
const { setupEmailService, sendNewScreeningAvailableNotification, sendPasswordResetEmail } = require('./emailService');
const crypto = require('crypto');
const { analyzeExamDocument } = require('./analysisService');

// 2. Inicializar as ferramentas
const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// 3. Configurar os middlewares
app.use(cors());
app.use(express.json());

// 4. Configurar o Multer
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }
const storage = multer.memoryStorage(); // Muda para armazenamento em memória
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// --- ROTAS PÚBLICAS ---
app.post('/register', async (req, res) => {
    const { fullName, email, password, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Este endereço de e-mail já está em uso.' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({ data: { fullName, email, password: hashedPassword, role } });
        res.status(201).json({ message: 'Utilizador cadastrado com sucesso!', userId: newUser.id });
    } catch (error) { console.error("Erro ao cadastrar:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, fullName: user.fullName }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) { console.error("Erro no login:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: 'Se um utilizador com este email existir, um link de redefinição foi enviado.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
        await prisma.user.update({
            where: { email: email },
            data: { passwordResetToken, passwordResetExpires },
        });
        await sendPasswordResetEmail(user.email, resetToken);
        res.status(200).json({ message: 'Se um utilizador com este email existir, um link de redefinição foi enviado.' });
    } catch (error) {
        console.error("Erro em forgot-password:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    try {
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken,
                passwordResetExpires: { gt: new Date() },
            },
        });
        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });
        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error("Erro em reset-password:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- ROTAS PROTEGIDAS ---

// Pacientes (Médico)
app.get('/api/patients', verifyToken, async (req, res) => {
  const doctorId = req.user.userId;
  const { search, page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page, 10), pageSizeNum = parseInt(pageSize, 10);
  try {
    const associations = await prisma.doctorPatient.findMany({ where: { doctorId: doctorId }, select: { patientId: true } });
    const associatedPatientIds = associations.map(assoc => assoc.patientId);
    if (associatedPatientIds.length === 0) {
        return res.status(200).json({ data: [], pagination: { total: 0, page: 1, pageSize: pageSizeNum, totalPages: 0 } });
    }
    const whereClause = { id: { in: associatedPatientIds }, role: 'PATIENT' };
    if (search) { whereClause.OR = [{ fullName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]; }
    const [patients, totalPatients] = await prisma.$transaction([
      prisma.user.findMany({ where: whereClause, select: { id: true, fullName: true, email: true, createdAt: true }, orderBy: { fullName: 'asc' }, skip: (pageNum - 1) * pageSizeNum, take: pageSizeNum }),
      prisma.user.count({ where: whereClause }),
    ]);
    res.status(200).json({ data: patients, pagination: { total: totalPatients, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(totalPatients / pageSizeNum) } });
  } catch (error) { console.error("Erro ao buscar pacientes associados:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.get('/api/patients/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const patient = await prisma.user.findFirst({ where: { id: id, role: 'PATIENT' }, select: { id: true, fullName: true, email: true, createdAt: true, updatedAt: true } });
        if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });
        res.status(200).json(patient);
    } catch (error) { console.error("Erro ao buscar detalhes do paciente:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

// Perfil (Utilizador Logado)
app.get('/api/profile/me', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, email: true, specialty: true } });
        if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
        res.status(200).json(user);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar perfil.' }); }
});

app.patch('/api/profile/me', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { fullName, specialty } = req.body;
    try {
        const updatedUser = await prisma.user.update({ where: { id: userId }, data: { fullName, specialty }, select: { fullName: true, email: true, specialty: true } });
        res.status(200).json({ message: 'Perfil atualizado com sucesso!', user: updatedUser });
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar perfil.' }); }
});

app.post('/api/profile/change-password', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Senha atual incorreta.' });
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: userId }, data: { password: hashedNewPassword } });
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro ao alterar senha.' }); }
});

// Triagens (Paciente e Médico)
app.get('/api/screening/questions', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    try {
        const questions = await prisma.question.findMany({ where: { OR: [{ creatorId: null }, { creatorId: doctorId }] }, orderBy: { category: 'asc' } });
        res.status(200).json(questions);
    } catch (error) { console.error("Erro ao buscar perguntas:", error); res.status(500).json({ message: 'Erro ao buscar perguntas.' }); }
});

app.post('/api/screening/start', verifyToken, async (req, res) => {
    const patientId = req.user.userId;
    try {
        const newScreening = await prisma.screenings.create({ data: { status: 'PENDING', patient: { connect: { id: patientId } } } });
        res.status(201).json({ screeningId: newScreening.id });
    } catch (error) { console.error("Erro ao iniciar nova triagem:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.get('/api/screening/:id/details', verifyToken, async (req, res) => {
    const screeningId = req.params.id;
    const patientId = req.user.userId;
    try {
        const screening = await prisma.screenings.findFirst({ where: { id: screeningId, patientId: patientId }, include: { answers: true, examFiles: true } });
        if (!screening) return res.status(404).json({ message: 'Triagem não encontrada.' });
        res.status(200).json(screening);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar detalhes da triagem.' }); }
});

app.post('/api/screening/:id/answers', verifyToken, async (req, res) => {
    const screeningId = req.params.id;
    const { answers } = req.body;
    const patientId = req.user.userId;
    try {
        const screening = await prisma.screenings.findFirst({ where: { id: screeningId, patientId: patientId } });
        if (!screening) return res.status(404).json({ message: 'Triagem não encontrada.' });
        const answerData = answers.map(answer => ({ value: answer.value, screeningId: screeningId, questionId: answer.questionId }));
        await prisma.$transaction([
            prisma.answer.deleteMany({ where: { screeningId: screeningId } }),
            prisma.answer.createMany({ data: answerData }),
            prisma.screenings.update({ where: { id: screeningId }, data: { status: 'COMPLETED' } }),
        ]);
        res.status(200).json({ message: 'Respostas salvas com sucesso!' });
    } catch (error) { console.error("Erro ao salvar respostas:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/api/screenings/:id/upload-exam', verifyToken, upload.single('examFile'), async (req, res) => {
    const screeningId = req.params.id;
    const patientId = req.user.userId;

    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
    }

    try {
        // 1. Confirma se a triagem pertence ao paciente
        const screening = await prisma.screenings.findFirst({
            where: { id: screeningId, patientId: patientId },
        });

        if (!screening) {
            // Não há arquivo para apagar, pois ele está apenas na memória
            return res.status(404).json({ message: 'Triagem não encontrada.' });
        }

        // 2. Chama o serviço de IA para analisar o buffer do arquivo
        console.log(`Iniciando análise de IA para o arquivo: ${req.file.originalname}`);
        const summaryParagraph = await analyzeExamDocument(req.file.buffer, req.file.mimetype);

        if (!summaryParagraph) {
            return res.status(400).json({ message: 'Não foi possível extrair um resumo do exame.' });
        }

        // 3. Salva o parágrafo de resumo diretamente na triagem
        // Esta lógica anexa novos resumos aos existentes, caso o paciente envie mais de um exame.
        const newSummary = screening.examSummary
            ? `${screening.examSummary}\n\n--- Resumo do Exame (${req.file.originalname}) ---\n${summaryParagraph}`
            : `--- Resumo do Exame (${req.file.originalname}) ---\n${summaryParagraph}`;

        await prisma.screenings.update({
            where: { id: screeningId },
            data: {
                examSummary: newSummary
            },
        });

        console.log(`Resumo do exame salvo com sucesso para a triagem ${screeningId}.`);

        // 4. Responde ao frontend com sucesso
        // Note que não criamos mais um registro de 'ExamFile', como solicitado.
        res.status(201).json({
            message: 'Exame analisado e resumo salvo com sucesso!',
            summary: summaryParagraph,
        });

    } catch (error) {
        console.error("Erro no processamento do exame com IA:", error);
        res.status(500).json({ message: 'Erro interno no servidor ao processar o exame.' });
    }
});

app.get('/api/screenings/pending-review', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    try {
        const associations = await prisma.doctorPatient.findMany({ where: { doctorId: doctorId }, select: { patientId: true } });
        const associatedPatientIds = associations.map(assoc => assoc.patientId);
        if (associatedPatientIds.length === 0) return res.status(200).json([]);
        const pendingScreenings = await prisma.screenings.findMany({ where: { status: 'COMPLETED', patientId: { in: associatedPatientIds } }, include: { patient: { select: { fullName: true } } }, orderBy: { updatedAt: 'desc' } });
        res.status(200).json(pendingScreenings);
    } catch (error) { console.error("Erro ao buscar triagens pendentes:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.get('/api/screenings/reviewed-today-count', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Define o início do dia de hoje

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Define o início do dia de amanhã

        const count = await prisma.screenings.count({
            where: {
                doctorId: doctorId,
                status: 'REVIEWED',
                updatedAt: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error("Erro ao contar triagens analisadas hoje:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.get('/api/screenings/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const screeningDetails = await prisma.screenings.findUnique({
            where: { id },
            include: {
                patient: { select: { fullName: true, email: true } },
                answers: { include: { question: { select: { text: true, category: true } } } },
                examFiles: { select: { id: true, originalName: true, filePath: true } },
            },
        });
        if (!screeningDetails) return res.status(404).json({ message: 'Triagem não encontrada.' });
        res.status(200).json(screeningDetails);
    } catch (error) { console.error("Erro ao buscar detalhes da triagem:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.patch('/api/screenings/:id/review', verifyToken, async (req, res) => {
    const screeningId = req.params.id;
    const { doctorNotes } = req.body;
    const doctorId = req.user.userId;
    if (req.user.role !== 'DOCTOR') return res.status(403).json({ message: 'Apenas médicos podem analisar triagens.' });
    try {
        const updatedScreening = await prisma.screenings.update({ where: { id: screeningId }, data: { status: 'REVIEWED', doctorNotes: doctorNotes, doctorId: doctorId } });
        res.status(200).json(updatedScreening);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Triagem não encontrada.' });
        console.error("Erro ao analisar triagem:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

app.get('/api/patient/screenings', verifyToken, async (req, res) => {
    const patientId = req.user.userId;
    try {
        const screeningsHistory = await prisma.screenings.findMany({ where: { patientId: patientId }, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, createdAt: true } });
        res.status(200).json(screeningsHistory);
    } catch (error) { console.error("Erro ao buscar histórico do paciente:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

// Gestão de Perguntas (Médico)
app.get('/api/questions', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    try {
        const questions = await prisma.question.findMany({ where: { OR: [{ creatorId: null }, { creatorId: doctorId }] }, orderBy: { category: 'asc' } });
        res.status(200).json(questions);
    } catch (error) { console.error("Erro ao buscar perguntas:", error); res.status(500).json({ message: 'Erro ao buscar perguntas.' }); }
});

app.post('/api/questions', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    const { text, category, type, options } = req.body;
    if (req.user.role !== 'DOCTOR') return res.status(403).json({ message: 'Apenas médicos podem criar perguntas.' });
    try {
        const newQuestion = await prisma.question.create({ data: { text, category, type, options, creatorId: doctorId } });
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Erro ao criar pergunta:", error);
        if (error.code === 'P2002') return res.status(409).json({ message: 'Uma pergunta com este texto já existe.' });
        res.status(500).json({ message: 'Erro ao criar pergunta.' });
    }
});

app.patch('/api/questions/:id', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    const questionId = req.params.id;
    const { text, category, type, options } = req.body;
    try {
        const question = await prisma.question.findFirst({ where: { id: questionId, creatorId: doctorId } });
        if (!question) return res.status(404).json({ message: 'Pergunta não encontrada ou não tem permissão para editar.' });
        const updatedQuestion = await prisma.question.update({ where: { id: questionId }, data: { text, category, type, options } });
        res.status(200).json(updatedQuestion);
    } catch (error) {
        console.error("Erro ao atualizar pergunta:", error);
        if (error.code === 'P2002') return res.status(409).json({ message: 'Uma pergunta com este texto já existe.' });
        res.status(500).json({ message: 'Erro ao atualizar pergunta.' });
    }
});

app.delete('/api/questions/:id', verifyToken, async (req, res) => {
    const doctorId = req.user.userId;
    const questionId = req.params.id;
    try {
        const question = await prisma.question.findFirst({ where: { id: questionId, creatorId: doctorId } });
        if (!question) return res.status(404).json({ message: 'Pergunta não encontrada ou não tem permissão para apagar.' });
        await prisma.answer.deleteMany({ where: { questionId: questionId } });
        await prisma.question.delete({ where: { id: questionId } });
        res.status(204).send();
    } catch (error) { console.error("Erro ao apagar pergunta:", error); res.status(500).json({ message: 'Erro ao apagar pergunta.' }); }
});

// Rotas de Administrador
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  const { role, search } = req.query;
  const whereClause = {};
  if (role && ['DOCTOR', 'PATIENT'].includes(role.toUpperCase())) {
    whereClause.role = role.toUpperCase();
  } else {
    whereClause.role = { in: ['DOCTOR', 'PATIENT'] };
  }
  if (search) {
    whereClause.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
      take: 20,
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar utilizadores:", error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.get('/api/admin/associations', verifyAdmin, async (req, res) => {
    try {
        const associations = await prisma.doctorPatient.findMany({ orderBy: { assignedAt: 'desc' }, include: { doctor: { select: { fullName: true } }, patient: { select: { fullName: true } } } });
        res.status(200).json(associations);
    } catch (error) { console.error("Erro ao buscar associações:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/api/admin/associate', verifyAdmin, async (req, res) => {
    const { doctorId, patientId } = req.body;
    const adminId = req.user.userId;
    try {
        await prisma.doctorPatient.create({ data: { doctorId, patientId, assignedBy: adminId } });
        res.status(201).json({ message: 'Associação criada com sucesso.' });
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ message: 'Este médico já está associado a este paciente.' });
        console.error("Erro ao associar:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

app.post('/api/admin/disassociate', verifyAdmin, async (req, res) => {
    const { doctorId, patientId } = req.body;
    try {
        await prisma.doctorPatient.delete({ where: { doctorId_patientId: { doctorId, patientId } } });
        res.status(200).json({ message: 'Associação removida com sucesso.' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Associação não encontrada.' });
        console.error("Erro ao desassociar:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) { console.error("Erro ao apagar utilizador:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.get('/api/admin/users/:id/screenings', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const screenings = await prisma.screenings.findMany({ where: { patientId: id }, select: { id: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
        res.status(200).json(screenings);
    } catch (error) { console.error("Erro ao buscar triagens do utilizador:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.delete('/api/admin/screenings/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.screenings.delete({ where: { id } });
        res.status(204).send();
    } catch (error) { console.error("Erro ao apagar triagem:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/api/admin/create-screening', verifyAdmin, async (req, res) => {
    const { patientId, doctorId } = req.body;
    try {
        await prisma.screenings.create({ data: { status: 'PENDING', patientId: patientId, doctorId: doctorId } });
        const patient = await prisma.user.findUnique({ where: { id: patientId } });
        const doctor = await prisma.user.findUnique({ where: { id: doctorId } });
        if (!patient || !doctor) return res.status(404).json({ message: 'Paciente ou médico não encontrado.' });
        await sendNewScreeningAvailableNotification(patient.email, patient.fullName, doctor.fullName);
        res.status(201).json({ message: `Triagem criada e notificação enviada para ${patient.fullName}.` });
    } catch (error) { console.error("Erro ao criar triagem:", error); res.status(500).json({ message: 'Erro interno.' }); }
});

app.get('/api/admin/patients/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await prisma.user.findFirst({
      where: { id: id, role: 'PATIENT' },
      select: {
        id: true,
        fullName: true,
        email: true,
        doctorsAsPatient: {
          select: {
            doctor: { select: { id: true, fullName: true } }
          }
        },
        screeningsAsPatient: {
          select: { 
            id: true, 
            status: true, 
            createdAt: true,
            doctor: {
              select: {
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado.' });
    const response = {
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      associatedDoctors: patient.doctorsAsPatient.map(assoc => assoc.doctor),
      screenings: patient.screeningsAsPatient
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao buscar detalhes do paciente para o admin:", error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// Rota para servir os ficheiros
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
  setupEmailService();
});
