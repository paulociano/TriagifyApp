const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('A iniciar o script de seed...');

  try {
    console.log('A tentar conectar-se à base de dados...');
    await prisma.$connect();
    console.log('Conexão com a base de dados bem-sucedida!');

    const questions = [
      // Categoria: Sintomas
      { text: 'Qual é o principal sintoma que o(a) trouxe à consulta?', category: 'Sintomas', type: 'OPEN_TEXT', options: [] },
      { text: 'Há quanto tempo este sintoma está presente?', category: 'Sintomas', type: 'OPEN_TEXT', options: [] },
      { text: 'Numa escala de 0 a 10, qual a intensidade do sintoma?', category: 'Sintomas', type: 'OPEN_TEXT', options: [] },

      // Categoria: Hábitos
      { text: 'Você fuma?', category: 'Hábitos', type: 'YES_NO', options: [] },
      { text: 'Com que frequência consome bebidas alcoólicas?', category: 'Hábitos', type: 'MULTIPLE_CHOICE', options: ['Diariamente', 'Semanalmente', 'Mensalmente', 'Raramente', 'Não consumo'] },
      { text: 'Você pratica atividade física regularmente?', category: 'Hábitos', type: 'YES_NO', options: [] },

      // Categoria: Histórico Médico
      { text: 'Você possui alguma doença crónica (ex: diabetes, hipertensão)? Se sim, qual?', category: 'Histórico Médico', type: 'OPEN_TEXT', options: [] },
      { text: 'Você já realizou alguma cirurgia? Se sim, qual e quando?', category: 'Histórico Médico', type: 'OPEN_TEXT', options: [] },
      { text: 'Você possui alguma alergia conhecida (medicamentos, alimentos, etc.)?', category: 'Histórico Médico', type: 'OPEN_TEXT', options: [] },
    ];

    console.log('A iniciar a inserção de perguntas...');
    for (const q of questions) {
      await prisma.question.upsert({
        where: { text: q.text },
        update: {},
        create: q,
      });
      console.log(`- Pergunta processada: "${q.text}"`);
    }

    console.log('Seeding concluído com sucesso!');

  } catch (error) {
    console.error('Ocorreu um erro durante o processo de seeding:', error);
    process.exit(1);
  } finally {
    console.log('A desconectar da base de dados...');
    await prisma.$disconnect();
  }
}

main();
