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
| `index.html` | Código completo do sistema (HTML + CSS + JS em um único arquivo) |
| `logo.png` | Logo da Fluortech |
| `PROJETO.md` | Esta documentação |

Observação: os arquivos `notificacoes.js` e `.github/workflows/notificacoes.yml` foram removidos — as notificações automáticas de calendário por email foram descontinuadas.

---

## Senhas de acesso

| Perfil | Senha |
|---|---|
| Usuário (Manutenção + Gestão) | 12345 |
| Admin | 123456 |

Definidas no `index.html`:
```javascript
const SENHA_USUARIO = '12345';
const SENHA_ADMIN = '123456';
```

O login foi unificado: uma única senha (12345) dá acesso às duas telas (Manutenção e Gestão). O admin continua separado (123456), acessível pelo link discreto "acesso admin" na tela de login.

---

## Estrutura de telas

Após login com a senha de usuário, a tela principal mostra duas abas no topo:

**🔧 Manutenção** — Lista de máquinas, busca, seleção de máquina para preencher checklist, e botão de acesso ao calendário. Equivale ao antigo perfil Técnico.

**📊 Gestão** — Painel com histórico de manutenções, filtros (mês/ano/tipo/setor/busca), stats, exportação Excel e acesso ao calendário. Equivale ao antigo perfil Gestor. O painel recarrega automaticamente ao trocar para esta aba.

**Admin** (senha própria) — CRUD de máquinas e checklists, edição do calendário preventivo, e aba de gerenciamento de registros (arquivar/restaurar).

---

## Tipos de manutenção e fluxo de preenchimento

O sistema tem 4 tipos de manutenção, divididos em dois fluxos diferentes:

**Preventiva e Preditiva** → usam o checklist tradicional da máquina (itens com OK/NOK, campo de observação para NOK) + assinatura.

**Corretiva e Inspeção** → NÃO usam checklist. Mostram um campo de texto único e obrigatório com o label "Registre aqui as correções realizadas na máquina:" + assinatura. No banco, esse texto é salvo como um único item com `secao: 'Registro'`.

No PDF:
- Preventiva/Preditiva: tabela de itens com totais OK/NOK
- Corretiva/Inspeção: bloco de texto corrido, sem tabela

---

## Código de formulário

Gerado automaticamente ao finalizar cada manutenção. Formato: `[PREFIXO][MÊS][ANO][CÓDIGO_MÁQUINA]`

| Tipo | Prefixo | Exemplo |
|---|---|---|
| Preditiva | PD | PD0626A001 |
| Preventiva | PV | PV0626E005 |
| Corretiva | C | C0626B001 |
| Inspeção | I | I0626H013 |

Aparece em: tela de sucesso, PDF, email, painel de gestão (primeira coluna), modal de detalhes, exportação Excel.

---

## Firebase

**Projeto:** Manutencoes Fluortech (Plano Blaze — pago)
**Região:** southamerica-east1 (São Paulo)

### Credenciais (no index.html)
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
- `dataHoraLocal` (string) — Ex: "16/07/2026, 11:30:00"
- `codigoFormulario` (string) — Ex: "C0626E005"
- `arquivado` (boolean, opcional) — quando `true`, o registro some das telas de Manutenção/Gestão mas continua no banco

**calendario** — Cada documento tem o mesmo ID da máquina correspondente:
- `maquinaId`, `maquinaNome`, `maquinaSetor`
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
Importante: todas as 3 coleções (`maquinas`, `manutencoes`, `calendario`) precisam estar listadas. Se uma faltar, as operações naquela coleção falham silenciosamente.

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

## Segurança — Firebase App Check (reCAPTCHA v3)

O App Check protege o Firebase contra acessos que não venham do site real. Requisições de fora do site (scripts, Postman, console em outro site, uso das chaves em outro domínio) são bloqueadas quando o enforcement está ativo.

**O que protege:** ataques externos usando as credenciais do Firebase.
**O que NÃO protege:** alguém que já está logado no site usando o console F12 ali dentro (isso só Cloud Functions resolveria).

### Chaves do reCAPTCHA v3
- **Chave do site** (pública, vai no `index.html`): `6LcqRlctAAAAACrHcpnKc_GGnvKFLiEc2z5sxITd`
- **Chave secreta** (privada, vai no Firebase App Check): `6LcqRlctAAAAAM4IhN03ribPjAyDJPXmpC751_Mk`

Regra de ouro: a chave do site fica no CÓDIGO; a chave secreta fica no FIREBASE. São um par correspondente — se forem trocadas, dá erro 400 (appCheck/throttled).

### Onde cada chave está configurada
- **No `index.html`**: import do módulo `firebase-app-check.js` + `initializeAppCheck(app, { provider: new ReCaptchaV3Provider('CHAVE_DO_SITE'), isTokenAutoRefreshEnabled: true })`, logo após `initializeApp` e antes de `getFirestore`.
- **No Firebase**: App Check → Apps → manutencoes-fluortech → campo "Chave reCAPTCHA do secret" (a chave secreta) + Vida útil do token: 1 hora.
- **No reCAPTCHA admin** (google.com/recaptcha/admin): domínio `jader-fluortech.github.io` deve estar cadastrado.

### Modo de operação
- **Monitorar** (atual): valida os tokens mas NÃO bloqueia nada. Seguro para produção.
- **Aplicar/Enforce**: bloqueia requisições sem token válido. Ativar em Firebase → App Check → APIs → Cloud Firestore → Aplicar.

Antes de ativar o Enforce, confirmar em App Check → APIs → Cloud Firestore que está em ~100% de requisições com token válido. Se algo travar após ativar, cancelar a imposição na mesma tela (reversível na hora).

O reCAPTCHA v3 é invisível ao usuário — não aparece popup nem desafio. Funciona de qualquer dispositivo (não está ligado ao aparelho, e sim ao fato de a requisição partir do site real).

### Custo
App Check é gratuito. reCAPTCHA v3 tem cota alta, não atingida em uso normal de fábrica. Não gera custo extra na mensalidade.

---

## Email (Brevo)

**Chave de API:** `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`

**Emails que recebem os relatórios:**
- jaderfilho@fluortech.com.br
- luiz.josue@fluortech.com.br

Para adicionar/remover emails, editar o array `EMAILS_DESTINO` no `index.html` (atenção: cada email entre aspas, separados por vírgula — vírgula faltando quebra todo o JavaScript).

O único email automático que existe é o enviado ao finalizar um checklist: corpo HTML com resumo + PDF assinado em anexo. As notificações de calendário (10 dias, 5 dias, atrasado, 30 dias sem manutenção) foram descontinuadas.

---

## Calendário de Manutenções Preventivas

- Exclusivo para manutenções Preventivas
- Ao finalizar uma preventiva, a próxima data avança automaticamente (+intervalo em meses a partir da data atual), mesmo que tenha sido adiantada
- Admin edita datas e intervalos pela aba "Calendário"
- Usuário visualiza (somente leitura) pelas abas Manutenção e Gestão

Status: Em dia (verde, +10 dias), Próximos 10 dias (amarelo), Atrasado (vermelho, linha destacada).

Configuração inicial: todas as 66 máquinas com data 10/10/2026, intervalo 6 meses.

Para reinicializar o calendário, rodar no console:
```javascript
await inicializarCalendarioMaquinas();
console.log("✅ Calendário inicializado!");
```

---

## Gerenciamento de registros (soft delete)

No acesso admin, aba "🗂️ Registros":
- Lista todos os registros com busca e filtro por status (ativos/arquivados/todos)
- Botão "Arquivar" → registro some das telas de Manutenção/Gestão mas fica no Firebase (campo `arquivado: true`)
- Botão "Restaurar" → traz de volta (`arquivado: false`)
- Registros arquivados aparecem acinzentados

O `carregarPainel()` filtra registros com `arquivado: true`, então eles ficam invisíveis para o usuário comum.

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

Checklists com 666 itens detalhados salvos no Firebase.

---

## Como editar o site

1. github.com/jader-fluortech/manutencoes-fluortech → `index.html` → lápis ✏️
2. `Ctrl+A` → colar novo conteúdo → Commit changes
3. Aguardar ~2 minutos para o site atualizar

## Como rodar scripts no console

1. Abrir o site → F12 → aba Console → colar script → Enter
2. Para escrever em coleções via console (fora do admin), abrir as regras temporariamente antes
3. Restaurar as regras padrão após terminar

## Como exportar checklists atuais

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
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + linhas.join("\n")], {type:"text/csv;charset=utf-8;"}));
  a.download = "maquinas_fluortech.csv"; a.click();
  console.log("✅ Exportado!");
})();
```

---

## Pendências / ideias futuras

- Ativar o enforcement do App Check (após confirmar 100% de tokens válidos)
- Definir datas reais de manutenção preventiva para cada máquina (atualmente todas em 10/10/2026)
- PDF como link no email (requer Firebase Storage)
- Blindagem contra manipulação pelo próprio console: exigiria Cloud Functions (backend que valida antes de gravar) — avaliado e adiado por adicionar complexidade e exigir Firebase CLI para deploy
