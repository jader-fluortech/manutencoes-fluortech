# Sistema de Manutenções Fluortech — Documentação do Projeto

## Links importantes
- **Site:** https://jader-fluortech.github.io/manutencoes-fluortech/
- **GitHub:** https://github.com/jader-fluortech/manutencoes-fluortech
- **Firebase:** https://console.firebase.google.com — projeto "Manutencoes Fluortech"
- **Brevo (email):** https://app.brevo.com

---

## Estrutura do projeto

Todo o código está em um único arquivo `index.html` no GitHub. Não há arquivos separados de CSS ou JavaScript — tudo está junto no mesmo arquivo. O arquivo `logo.png` também está no repositório.

---

## Senhas de acesso

| Perfil | Senha |
|---|---|
| Técnico | 1234 |
| Gestor | 12345 |
| Admin | 123456 |

As senhas estão definidas no `index.html`:
- `const SENHA_TECNICO = '1234';`
- `const SENHA_GESTOR = '12345';`
- `const SENHA_ADMIN = '123456';`

---

## Perfis de acesso

**Técnico** — Acessa a lista de máquinas, preenche o checklist, assina digitalmente e finaliza. Ao finalizar, o sistema salva no Firebase e envia email com PDF em anexo.

**Gestor** — Acessa o painel com histórico de todas as manutenções, filtros por data/mês/ano/setor/tipo, visualização de detalhes, download de PDF e exportação para Excel (CSV com separador `;`).

**Admin** — Acessa via link discreto "acesso admin" na tela de login. Permite adicionar, editar e excluir máquinas e checklists. Link não aparece após login.

---

## Firebase

**Projeto:** Manutencoes Fluortech (Plano Spark — gratuito)
**Região:** southamerica-east1 (São Paulo)

### Credenciais Firebase (já no index.html)
```javascript
apiKey: "AIzaSyDZadgIZLA4aOz33SQJDcxUgTrMKXwrf3Q"
authDomain: "manutencoes-fluortech.firebaseapp.com"
projectId: "manutencoes-fluortech"
storageBucket: "manutencoes-fluortech.firebasestorage.app"
messagingSenderId: "524530859774"
appId: "1:524530859774:web:3d784e49984d45a85a2faf"
```

### Coleções do Firestore

**maquinas** — Cada documento representa uma máquina com os campos:
- `nome` (string) — Ex: "A001 - Prensa Hidráulica"
- `setor` (string) — Ex: "Moldagem"
- `tipo` (string) — Ex: "PRENSA HIDRÁULICA"
- `checklist` (array) — Lista de objetos `{ secao, texto }`

**manutencoes** — Cada documento representa um registro de manutenção com os campos:
- `maquinaId`, `maquinaNome`, `maquinaSetor`
- `tecnicoNome`, `tipoManutencao`, `obsInicial`
- `itens` (array) — `{ texto, secao, resultado, observacao }`
- `assinatura` (string base64)
- `dataHora` (timestamp Firebase)
- `dataHoraLocal` (string) — Ex: "19/06/2026, 15:30:00"

### Regras do Firebase

**Regras ativas (padrão):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /maquinas/{id} {
      allow read: if true;
      allow write: if true;
    }
    match /manutencoes/{id} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**Regras abertas (usar temporariamente para rodar scripts no console):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
⚠️ Sempre restaurar as regras padrão após rodar scripts.

---

## Email (Brevo)

**Chave de API:** `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`

**Emails que recebem os relatórios:**
- jaderfilho@fluortech.com.br

Para adicionar mais emails, editar no `index.html`:
```javascript
const EMAILS_DESTINO = [
  'jaderfilho@fluortech.com.br',
  // 'outro@fluortech.com.br',
];
```

O email é enviado automaticamente ao finalizar um checklist com:
- Corpo HTML com resumo da manutenção
- PDF assinado em anexo

---

## Máquinas cadastradas (66 máquinas)

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

---

## Cores do site

```css
--cor-destaque: #111D5C;        /* azul escuro Fluortech */
--cor-destaque-hover: #1E2F8A;  /* azul médio */
--cor-fundo-tela: #FFFFFF;      /* branco */
--cor-fundo-card: #F4F6FB;      /* azul muito claro */
--cor-fundo-interno: #EEF1F8;   /* azul suave */
--cor-borda: #C5CBDF;           /* azul acinzentado */
--cor-texto: #1A1A2E;           /* azul quase preto */
--cor-ok: #2E7D32;              /* verde escuro */
--cor-nok: #C62828;             /* vermelho escuro */
--cor-link: #1565C0;            /* azul */
```

---

## Como editar o site

1. Acesse github.com/jader-fluortech/manutencoes-fluortech
2. Clique em `index.html`
3. Clique no lápis ✏️
4. Faça as alterações
5. Clique em "Commit changes" → "Commit changes"
6. Aguarde 2 minutos para o site atualizar

---

## Como rodar scripts no Firebase

1. Abra o site no navegador
2. Pressione F12 → aba Console
3. Cole o script e pressione Enter
4. Se precisar escrever em máquinas, abra as regras temporariamente antes

---

## Pendências futuras

- PDF como link no email (requer Firebase Storage pago ou solução alternativa)
- Checklists reais para setores: Acabamento, Externo, N/A, Inspeção (atualmente simbólicos)
- Considerar migração para plano Blaze para autenticação avançada
