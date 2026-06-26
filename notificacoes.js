// notificacoes.js — Script de notificações automáticas
// Roda todo dia às 8h via GitHub Actions

const fetch = require('node-fetch');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAILS_DESTINO = (process.env.EMAILS_DESTINO || '').split(',').map(e => e.trim()).filter(Boolean);

// ===== FIREBASE REST API =====
async function getColecao(colecao) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${colecao}?key=${FIREBASE_API_KEY}&pageSize=500`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.documents) return [];
  return data.documents.map(doc => {
    const id = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const obj = { id };
    for (const [k, v] of Object.entries(fields)) {
      if (v.stringValue !== undefined) obj[k] = v.stringValue;
      else if (v.integerValue !== undefined) obj[k] = parseInt(v.integerValue);
      else if (v.doubleValue !== undefined) obj[k] = v.doubleValue;
      else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
      else if (v.nullValue !== undefined) obj[k] = null;
      else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
    }
    return obj;
  });
}

// ===== UTILITÁRIOS =====
function calcularDiasRestantes(dataISO) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const proxima = new Date(dataISO + 'T00:00:00');
  return Math.ceil((proxima - hoje) / (1000 * 60 * 60 * 24));
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ===== ENVIAR EMAIL =====
async function enviarEmail(assunto, htmlContent) {
  if (EMAILS_DESTINO.length === 0) { console.log('Nenhum email de destino configurado.'); return; }
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Manutenção Fluortech', email: EMAILS_DESTINO[0] },
      to: EMAILS_DESTINO.map(email => ({ email })),
      subject: assunto,
      htmlContent
    })
  });
  if (resp.ok) console.log(`✅ Email enviado: ${assunto}`);
  else { const err = await resp.json(); console.error('❌ Erro ao enviar email:', err.message); }
}

// ===== TEMPLATE DE EMAIL =====
function templateEmail(titulo, subtitulo, linhasTabela, rodape) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#111D5C;padding:20px;border-bottom:3px solid #35438C">
        <h2 style="color:#FFFFFF;margin:0">⚙️ Manutenção Fluortech</h2>
        <p style="color:#aaa;margin:4px 0 0">${subtitulo}</p>
      </div>
      <div style="padding:20px;background:#fff">
        <h3 style="color:#111D5C;margin-bottom:16px">${titulo}</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee">
          <thead>
            <tr style="background:#111D5C">
              <th style="padding:8px 12px;color:#fff;text-align:left">Máquina</th>
              <th style="padding:8px 12px;color:#fff;text-align:left">Setor</th>
              <th style="padding:8px 12px;color:#fff;text-align:left">Data Prevista</th>
              <th style="padding:8px 12px;color:#fff;text-align:left">Situação</th>
            </tr>
          </thead>
          <tbody>${linhasTabela}</tbody>
        </table>
      </div>
      <div style="background:#f5f5f5;padding:14px 20px;font-size:12px;color:#aaa;text-align:center">
        ${rodape}<br>
        <a href="https://jader-fluortech.github.io/manutencoes-fluortech/" style="color:#111D5C">Acessar o sistema</a>
      </div>
    </div>`;
}

function linhaTabela(maquina, cor, situacao, bg) {
  return `<tr style="background:${bg}">
    <td style="padding:8px 12px;font-weight:600">${maquina.maquinaNome || '-'}</td>
    <td style="padding:8px 12px">${maquina.maquinaSetor || '-'}</td>
    <td style="padding:8px 12px">${formatarDataBR(maquina.proximaManutencao)}</td>
    <td style="padding:8px 12px;color:${cor};font-weight:600">${situacao}</td>
  </tr>`;
}

// ===== MAIN =====
async function main() {
  console.log(`\n🕐 Verificando notificações em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}...\n`);

  const calendario = await getColecao('calendario');
  console.log(`📋 ${calendario.length} máquinas no calendário`);

  if (calendario.length === 0) { console.log('Nenhuma máquina no calendário.'); return; }

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  // Classificar máquinas
  const em10dias = [];
  const em5dias = [];
  const atrasadas = [];
  const sem30dias = [];

  for (const m of calendario) {
    if (!m.proximaManutencao) continue;
    const dias = calcularDiasRestantes(m.proximaManutencao);

    if (dias < 0) atrasadas.push({ ...m, dias });
    else if (dias <= 5) em5dias.push({ ...m, dias });
    else if (dias <= 10) em10dias.push({ ...m, dias });
  }

  // Verificar máquinas sem manutenção há mais de 30 dias
  const manutencoes = await getColecao('manutencoes');
  console.log(`📊 ${manutencoes.length} manutenções no histórico`);

  // Agrupar última manutenção por máquina
  const ultimasPorMaquina = {};
  for (const m of manutencoes) {
    const id = m.maquinaId;
    if (!id) continue;
    const data = m.dataHoraLocal ? m.dataHoraLocal.split(',')[0].trim() : null;
    if (!data) continue;
    const [dia, mes, ano] = data.split('/');
    const dataObj = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    if (!ultimasPorMaquina[id] || dataObj > ultimasPorMaquina[id].data) {
      ultimasPorMaquina[id] = { data: dataObj, nome: m.maquinaNome, setor: m.maquinaSetor };
    }
  }

  for (const m of calendario) {
    const ultima = ultimasPorMaquina[m.maquinaId];
    if (!ultima) continue;
    const diasSemManutencao = Math.floor((hoje - ultima.data) / (1000 * 60 * 60 * 24));
    if (diasSemManutencao >= 30) {
      sem30dias.push({ ...m, diasSemManutencao, ultimaData: ultima.data });
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`  - Manutenções em 10 dias: ${em10dias.length}`);
  console.log(`  - Manutenções em 5 dias: ${em5dias.length}`);
  console.log(`  - Atrasadas: ${atrasadas.length}`);
  console.log(`  - Sem manutenção há 30+ dias: ${sem30dias.length}`);

  // ===== EMAIL 1: AVISO DE 10 DIAS =====
  if (em10dias.length > 0) {
    const linhas = em10dias.map((m, i) =>
      linhaTabela(m, '#E65100', `⚠ ${m.dias} dias restantes`, i % 2 === 0 ? '#fff8f0' : '#fff')
    ).join('');
    await enviarEmail(
      `⚠️ Manutenções Preventivas em 10 dias — Fluortech`,
      templateEmail(
        `${em10dias.length} máquina(s) com manutenção preventiva nos próximos 10 dias`,
        'Aviso de Manutenção Preventiva',
        linhas,
        `Aviso gerado automaticamente em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      )
    );
  }

  // ===== EMAIL 2: AVISO DE 5 DIAS =====
  if (em5dias.length > 0) {
    const linhas = em5dias.map((m, i) =>
      linhaTabela(m, '#C62828', `🔴 ${m.dias} dias restantes`, i % 2 === 0 ? '#fff5f5' : '#fff')
    ).join('');
    await enviarEmail(
      `🔴 URGENTE: Manutenções Preventivas em 5 dias — Fluortech`,
      templateEmail(
        `${em5dias.length} máquina(s) com manutenção preventiva nos próximos 5 dias`,
        'Aviso Urgente de Manutenção Preventiva',
        linhas,
        `Aviso urgente gerado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      )
    );
  }

  // ===== EMAIL 3: MANUTENÇÕES ATRASADAS =====
  if (atrasadas.length > 0) {
    const linhas = atrasadas.map((m, i) =>
      linhaTabela(m, '#C62828', `✘ ${Math.abs(m.dias)} dias atrasada`, i % 2 === 0 ? '#fff0f0' : '#fff')
    ).join('');
    await enviarEmail(
      `🚨 Manutenções Preventivas ATRASADAS — Fluortech`,
      templateEmail(
        `${atrasadas.length} máquina(s) com manutenção preventiva atrasada`,
        'Alerta de Manutenção Atrasada',
        linhas,
        `Alerta gerado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      )
    );
  }

  // ===== EMAIL 4: SEM MANUTENÇÃO HÁ 30 DIAS =====
  if (sem30dias.length > 0) {
    const linhas = sem30dias.map((m, i) =>
      linhaTabela(
        { ...m, proximaManutencao: m.ultimaData?.toISOString().split('T')[0] },
        '#C62828',
        `${m.diasSemManutencao} dias sem manutenção`,
        i % 2 === 0 ? '#fff0f0' : '#fff'
      )
    ).join('');
    await enviarEmail(
      `⚠️ Máquinas sem manutenção há 30+ dias — Fluortech`,
      templateEmail(
        `${sem30dias.length} máquina(s) sem atualização de manutenção há mais de 30 dias`,
        'Alerta de Inatividade de Manutenção',
        linhas,
        `Alerta gerado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      )
    );
  }

  console.log('\n✅ Verificação concluída!\n');
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
