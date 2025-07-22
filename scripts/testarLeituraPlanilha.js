// scripts/testarLeituraPlanilha.js (versão CommonJS)

const { getSheetData } = require("../lib/googleSheetsService");

(async () => {
  const abas = ["Oportunidades", "Pagamentos"];

  for (const aba of abas) {
    try {
      const { header, rows } = await getSheetData(aba);
      console.log(`\n📋 ABA: ${aba}`);
      console.log("🔹 Colunas lidas:", header);
      console.log("🔹 Primeira linha de dados:", rows[0]);
      console.log(`🔹 Total de linhas: ${rows.length}`);
    } catch (error) {
      console.error(`❌ Erro ao ler a aba "${aba}":`, error.message);
    }
  }
})();

