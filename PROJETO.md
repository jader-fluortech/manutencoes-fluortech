# Sistema de Manutenções Fluortech — Documentação do Projeto

## Links importantes
- **Site:** https://jader-fluortech.github.io/manutencoes-fluortech/
- **GitHub:** https://github.com/jader-fluortech/manutencoes-fluortech
- **Firebase:** https://console.firebase.google.com — projeto "Manutencoes Fluortech"
- **Brevo (email):** https://app.brevo.com

---

## Arquivos no repositório

| Arquivo | Função |
|---|---|
| `index.html` | Código completo do sistema (HTML + CSS + JS) |
| `logo.png` | Logo da Fluortech |
| `PROJETO.md` | Esta documentação |
| `notificacoes.js` | Script Node.js de notificações automáticas por email |
| `.github/workflows/notificacoes.yml` | Workflow GitHub Actions (roda todo dia às 8h Brasília) |

---

## Senhas de acesso

| Perfil | Senha |
|---|---|
| Técnico | 1234 |
| Gestor | 12345 |
| Admin | 123456 |

Definidas no `index.html`:
```javascript
const SENHA_TECNICO = '1234';
const SENHA_GESTOR = '12345';
const SENHA_ADMIN = '123456';
```

---

## Perfis de acesso

**Técnico** — Acessa a lista de máquinas, preenche o checklist, assina digitalmente e finaliza. Ao finalizar, o sistema salva no Firebase, envia email com PDF em anexo, e atualiza o calendário automaticamente se for manutenção preventiva. Também pode visualizar o calendário preventivo.

**Gestor** — Acessa o painel com histórico de todas as manutenções, filtros por mês/ano/setor/tipo, visualização de detalhes, download de PDF, exportação para Excel e visualização do calendário preventivo.

**Admin** — Acessa via link discreto "acesso admin" na tela de login. Permite:
- Adicionar, editar e excluir máquinas e checklists
- Editar datas e intervalos do calendário preventivo
- Sessão persiste ao recarregar a página (sessionStorage)

---

## Código de formulário

Gerado automaticamente ao finalizar cada manutenção. Formato: `[PREFIXO][MÊS][ANO][CÓDIGO_MÁQUINA]`

| Tipo | Prefixo | Exemplo |
|---|---|---|
| Preditiva | PD | PD0626A001 |
| Preventiva | PV | PV0626E005 |
| Corretiva | C | C0626B001 |
| Inspeção | I | I0626H013 |

Aparece em: tela de sucesso, PDF, email, painel do gestor (primeira coluna), modal de detalhes, exportação Excel.

---

## Firebase

**Projeto:** Manutencoes Fluortech (Plano Spark — gratuito)
**Região:** southamerica-east1 (São Paulo)

### Credenciais (já no index.html e nos secrets do GitHub)
```javascript
apiKey: "AIzaSyDZadgIZLA4aOz33SQJDcxUgTrMKXwrf3Q"
authDomain: "manutencoes-fluortech.firebaseapp.com"
projectId: "manutencoes-fluortech"
storageBucket: "manutencoes-fluortech.firebasestorage.app"
messagingSenderId: "524530859774"
appId: "1:524530859774:web:3d784e49984d45a85a2faf"
```

### Coleções do Firestore

**maquinas** — Cada documento representa uma máquina:
- `nome` (string) — Ex: "A001 - Prensa Hidráulica"
- `setor` (string) — Ex: "Moldagem"
- `tipo` (string) — Ex: "PRENSA HIDRÁULICA"
- `checklist` (array) — Lista de objetos `{ secao, texto }`

**manutencoes** — Cada documento representa um registro de manutenção:
- `maquinaId`, `maquinaNome`, `maquinaSetor`
- `tecnicoNome`, `tipoManutencao`, `obsInicial`
- `itens` (array) — `{ texto, secao, resultado, observacao }`
- `assinatura` (string base64)
- `dataHora` (timestamp Firebase)
- `dataHoraLocal` (string) — Ex: "26/06/2026, 11:30:00"
- `codigoFormulario` (string) — Ex: "C0626E005"

**calendario** — Cada documento tem o mesmo ID da máquina correspondente:
- `maquinaId` (string)
- `maquinaNome` (string)
- `maquinaSetor` (string)
- `proximaManutencao` (string YYYY-MM-DD) — Ex: "2026-10-10"
- `ultimaManutencao` (string YYYY-MM-DD ou null)
- `intervaloMeses` (number) — padrão: 6

### Regras do Firebase (ativas)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /maquinas/{id} { allow read: if true; allow write: if true; }
    match /manutencoes/{id} { allow read: if true; allow write: if true; }
    match /calendario/{id} { allow read: if true; allow write: if true; }
  }
}
```

### Regras abertas (temporárias para scripts no console)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```
⚠️ Sempre restaurar as regras padrão após rodar scripts.

---

## Calendário de Manutenções Preventivas

### Como funciona
- Exclusivo para manutenções **Preventivas**
- Ao finalizar uma manutenção preventiva, o calendário é atualizado automaticamente com a próxima data (+intervalo em meses a partir da data atual)
- Admin pode editar datas e intervalos manualmente pela aba "Calendário" no acesso admin
- Técnico e Gestor visualizam o calendário (somente leitura)

### Status das máquinas
| Status | Critério | Cor |
|---|---|---|
| Em dia | Mais de 10 dias para a próxima manutenção | Verde |
| Próximos 10 dias | Entre 0 e 10 dias | Amarelo |
| Atrasado | Data já passou | Vermelho (linha destacada) |

### Configuração inicial
- Todas as 66 máquinas inicializadas com data **10/10/2026**, intervalo de **6 meses**

### Como inicializar o calendário (caso necessário)
Rodar no console do site:
```javascript
await inicializarCalendarioMaquinas();
console.log("✅ Calendário inicializado!");
```

---

## Emails automáticos (GitHub Actions)

### Agendamento
Roda todo dia às **11h UTC (8h horário de Brasília)** via `.github/workflows/notificacoes.yml`

### Quando emails são enviados
| Situação | Assunto |
|---|---|
| Máquinas com manutenção em ≤ 10 dias | ⚠️ Manutenções Preventivas em 10 dias |
| Máquinas com manutenção em ≤ 5 dias | 🔴 URGENTE: Manutenções Preventivas em 5 dias |
| Máquinas com manutenção atrasada | 🚨 Manutenções Preventivas ATRASADAS |
| Máquinas sem manutenção há 30+ dias | ⚠️ Máquinas sem manutenção há 30+ dias |

Múltiplas máquinas na mesma condição são agrupadas em **um único email** com lista completa.

### Como testar manualmente
GitHub → **Actions** → **Notificações de Manutenção** → **Run workflow** → **Run workflow**

### Secrets configurados no GitHub
| Secret | Valor |
|---|---|
| `FIREBASE_API_KEY` | AIzaSyDZadgIZLA4aOz33SQJDcxUgTrMKXwrf3Q |
| `FIREBASE_PROJECT_ID` | manutencoes-fluortech |
| `BREVO_API_KEY` | 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 |
| `EMAILS_DESTINO` | jaderfilho@fluortech.com.br |

---

## Email (Brevo)

**Chave de API:** `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`

**Emails que recebem os relatórios:** jaderfilho@fluortech.com.br

Para adicionar mais emails, editar no `index.html` e no secret `EMAILS_DESTINO` do GitHub:
```javascript
const EMAILS_DESTINO = [
  'jaderfilho@fluortech.com.br',
  // 'outro@fluortech.com.br',
];
```

---

## Cores do site

```css
--cor-destaque: #111D5C;        /* azul escuro Fluortech */
--cor-destaque-hover: #1E2F8A;
--cor-fundo-tela: #FFFFFF;
--cor-fundo-card: #F4F6FB;
--cor-fundo-interno: #EEF1F8;
--cor-borda: #C5CBDF;
--cor-texto: #1A1A2E;
--cor-ok: #2E7D32;
--cor-nok: #C62828;
--cor-link: #1565C0;
--cor-alerta: #E65100;
```

---

## Máquinas cadastradas (66 máquinas, 666 itens de checklist)

| Código | Equipamento | Setor |
|---|---|---|
| A001 | Prensa Hidráulica | Moldagem |
| A002 | Prensa Hidráulica | Moldagem |
| A003 | Prensa Hidráulica | Moldagem |
| A004 | Prensa Hidráulica | Moldagem |
| A006 | Prensa Hidráulica | Moldagem |
| A007 | Prensa Hidráulica | Moldagem |
| A008 | Prensa Hidráulica | Moldagem |
| A009 | Prensa Hidráulica | Moldagem |
| A010 | Prensa Hidráulica | Moldagem |
| A011 | Prensa Hidráulica | Moldagem |
| A012 | Prensa Hidráulica | Moldagem |
| A013 | Prensa Hidráulica | Moldagem |
| A014 | Prensa Hidráulica | Moldagem |
| A022 | Prensa Manual | Sinterização |
| A024 | Prensa Hidráulica | Moldagem |
| B001 | Forno a Gás | Sinterização |
| B002 | Forno a Gás | Sinterização |
| B003 | Forno Elétrico | Sinterização |
| B004 | Forno Elétrico | Sinterização |
| B005 | Forno Elétrico (Estufa) | Moldagem |
| B006 | Forno Elétrico (Estufa) | Usinagem |
| C001 | Torno Mecânico | Usinagem |
| C002 | Torno Mecânico | Moldagem |
| C003 | Torno Mecânico | Usinagem |
| C006 | Torno Mecânico | Usinagem |
| D002 | Torno Revólver | Usinagem |
| D003 | Torno Revólver | Usinagem |
| D004 | Torno Revólver | Usinagem |
| D005 | Torno Revólver | Usinagem |
| D007 | Torno Revólver | Usinagem |
| D011 | Torno Revólver | Usinagem |
| E001 | Centro de Usinagem D800 | Usinagem |
| E002 | Torno CNC GL 280 | Usinagem |
| E003 | Torno CNC Mach9 | Usinagem |
| E004 | Torno CNC Mach9 | Usinagem |
| E005 | Torno CNC Mach9 | Usinagem |
| E006 | Torno CNC Mach9 | Usinagem |
| E008 | Torno CNC GL | Usinagem |
| E009 | Torno CNC GSK | Usinagem |
| E010 | Torno CNC | Usinagem |
| E011 | Torno CNC Mach9 | Usinagem |
| E012 | Torno CNC Mach9 | Usinagem |
| E013 | Torno CNC GSK | Usinagem |
| E014 | Torno CNC GSK | Usinagem |
| E015 | Torno CNC GSK | Usinagem |
| F008 | Torno Automático | Usinagem |
| G005 | Refrigerador | N/A |
| GDT 168 | Gerador | Externo |
| H002 | Tamboreador | Tamboreamento |
| H003 | Tamboreador | Tamboreamento |
| H004 | Calandra | Usinagem |
| H006 | Torno Laminador | Usinagem |
| H011 | Prensa | Usinagem |
| H012 | Prensa | Usinagem |
| H013 | Bancada de Ranhura | Inspeção |
| H015 | Freza | Acabamento |
| H016 | Máquina de Estampar | Acabamento |
| H018 | Seladora | Inspeção |
| H019 | Freza | Acabamento |
| K001 | Retífica | Usinagem |
| K003 | Furadeira | N/A |
| K004 | Serra Hidráulica Franho | Tamboreamento |
| R001 | Retífica | Usinagem |
| R003 | Retífica | Usinagem |
| R004 | Retífica | Usinagem |
| R005 | Esmeril Rebolo | Usinagem |

Checklists com 666 itens detalhados salvos no Firebase. Atualizados em 22/06/2026.

---

## Como editar o site

1. Acesse github.com/jader-fluortech/manutencoes-fluortech
2. Clique em `index.html` → lápis ✏️
3. `Ctrl+A` → colar novo conteúdo → Commit changes
4. Aguardar 2 minutos para o site atualizar

## Como exportar checklists atuais

Rodar no console do site:
```javascript
(async () => {
  const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const snap = await getDocs(collection(window._db, "maquinas"));
  const linhas = [["Código","Nome Completo","Setor","Tipo","Item Checklist"].join(";")];
  snap.forEach(d => {
    const m = d.data();
    if (!m.nome) return;
    (m.checklist || []).forEach((item, i) => {
      linhas.push([i===0?m.nome.split(" - ")[0]:"", i===0?m.nome:"", i===0?m.setor:"", i===0?(m.tipo||""):"", item.texto||""].join(";"));
    });
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + linhas.join("\n"), {type:"text/csv;charset=utf-8;"}]));
  a.download = "maquinas_fluortech.csv"; a.click();
  console.log("✅ Exportado!");
})();
```

## Como adicionar novos anos no filtro do painel

No `index.html`, procure:
```html
<option value="2027">2027</option>
<option value="2028">2028</option>
```
E adicione mais linhas seguindo o mesmo padrão.

---

## Pendências futuras

- PDF como link no email (requer Firebase Storage pago)
- Definir datas reais de manutenção para cada máquina (atualmente todas em 10/10/2026)
- Considerar migração para plano Blaze para autenticação avançada
