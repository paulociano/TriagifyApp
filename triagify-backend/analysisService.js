// Em analysisService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Função auxiliar para converter o buffer do arquivo
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Analisa um documento de exame usando a Gemini AI e gera um parágrafo-resumo.
 * @param {Buffer} fileBuffer O buffer do arquivo em memória.
 * @param {string} mimeType O tipo MIME do arquivo.
 * @returns {Promise<string | null>} Uma string contendo o parágrafo-resumo.
 */
async function analyzeExamDocument(fileBuffer, mimeType) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um assistente de IA treinado para auxiliar profissionais de saúde. 
      Analise a imagem deste documento de exame médico e gere um parágrafo-resumo conciso em português. 
      O resumo deve destacar os principais resultados, mencionando quaisquer valores que pareçam notáveis, anormais ou fora da faixa de referência, se disponível. 
      O texto deve ser claro, objetivo, técnico e escrito em um formato de parágrafo único, pronto para ser lido por um médico.
      Responda APENAS com o parágrafo.
    `;

    const imagePart = fileToGenerativePart(fileBuffer, mimeType);
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    
    return response.text();

  } catch (error) {
    console.error("Erro ao analisar documento com a Gemini AI:", error);
    return null;
  }
}

module.exports = { analyzeExamDocument };