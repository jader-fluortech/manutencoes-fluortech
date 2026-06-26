# Sistema de Manutenções Fluortech — PROJECT.md

## Visão Geral

Sistema web para gestão de manutenções industriais da Fluortech.

O sistema permite que técnicos executem checklists de manutenção diretamente pelo navegador, realizem assinatura digital e gerem registros rastreáveis armazenados no Firebase. Os gestores podem consultar históricos, exportar relatórios e acompanhar indicadores operacionais.

A aplicação funciona integralmente no navegador e não requer instalação.

---

# Links Importantes

## Site

https://jader-fluortech.github.io/manutencoes-fluortech/

## Repositório GitHub

https://github.com/jader-fluortech/manutencoes-fluortech

## Firebase

Projeto: **Manutencoes Fluortech**

https://console.firebase.google.com

## Brevo

https://app.brevo.com

---

# Arquitetura do Projeto

## Estrutura Física

Todo o sistema está concentrado em um único arquivo:

```text
index.html
```

O arquivo contém:

* HTML
* CSS
* JavaScript
* Integração Firebase
* Integração Brevo
* Geração de PDF
* Exportação CSV

Arquivos adicionais:

```text
logo.png
```

Não existem arquivos separados para:

* CSS
* JavaScript
* Configurações

Toda a lógica da aplicação encontra-se dentro do próprio `index.html`.

---

# Tecnologias Utilizadas

## Frontend

* HTML5
* CSS3
* JavaScript Vanilla

## Bibliotecas

### Firebase SDK

Versão:

```text
10.12.0
```

Serviços utilizados:

* Firebase App
* Cloud Firestore

### jsPDF

Utilizada para geração dos relatórios PDF.

---

# Perfis de Acesso

## Técnico

Senha:

```text
1234
```

Funcionalidades:

* Selecionar máquina
* Pesquisar máquinas por nome ou setor
* Informar nome do técnico
* Escolher tipo de manutenção
* Registrar observações iniciais
* Preencher checklist
* Registrar observações em itens NOK
* Assinar digitalmente
* Finalizar manutenção
* Gerar PDF
* Enviar relatório por email

---

## Gestor

Senha:

```text
12345
```

Funcionalidades:

* Visualizar histórico completo
* Filtrar por:

  * Mês
  * Ano
  * Setor
  * Tipo
* Consultar indicadores
* Visualizar detalhes completos
* Baixar PDF
* Exportar CSV

---

## Administrador

Senha:

```text
123456
```

Acesso realizado através do link discreto:

```text
Acesso Admin
```

Funcionalidades:

* Adicionar máquinas
* Editar máquinas
* Excluir máquinas
* Configurar checklists
* Gerenciar calendário preventivo
* Alterar intervalos de manutenção

---

# Persistência de Sessão

O sistema utiliza `sessionStorage`.

Chaves utilizadas:

```javascript
fl_logado
fl_perfil
fl_tela
```

Objetivos:

* Manter usuário autenticado
* Restaurar tela após atualização da página
* Preservar navegação do sistema

---

# Fluxo Operacional

## Técnico

1. Login
2. Seleção da máquina
3. Informar técnico responsável
4. Escolher tipo de manutenção
5. Inserir observações iniciais
6. Preencher checklist
7. Assinar digitalmente
8. Finalizar manutenção
9. Salvar no Firebase
10. Gerar PDF
11. Enviar email automático

---

## Gestor

1. Login
2. Acesso ao painel
3. Aplicação de filtros
4. Consulta de registros
5. Visualização de detalhes
6. Download de PDF
7. Exportação CSV

---

## Administrador

1. Login Admin
2. Gerenciamento de máquinas
3. Gerenciamento de checklists
4. Configuração do calendário preventivo

---

# Código de Formulário

Cada manutenção recebe um identificador único.

Formato:

```text
[PREFIXO][MÊS][ANO][CÓDIGO_MÁQUINA]
```

## Prefixos

| Tipo       | Prefixo |
| ---------- | ------- |
| Preditiva  | PD      |
| Preventiva | PV      |
| Corretiva  | C       |
| Inspeção   | I       |

## Exemplos

```text
PD0626A001
PV0626E005
C0626B001
I0626H013
```

O código é exibido em:

* Tela de sucesso
* PDF
* Email
* Histórico do gestor
* Modal de detalhes
* Exportação CSV

---

# Firebase

## Projeto

```text
Manutencoes Fluortech
```

## Região

```text
southamerica-east1
(São Paulo)
```

## Coleções

### maquinas

Estrutura:

```json
{
  "nome": "E005 - Torno CNC Mach9",
  "setor": "Usinagem",
  "tipo": "TORNO CNC",
  "checklist": [
    {
      "secao": "Inspeção Geral",
      "texto": "Verificar lubrificação"
    }
  ]
}
```

---

### manutencoes

Estrutura:

```json
{
  "maquinaId": "",
  "maquinaNome": "",
  "maquinaSetor": "",
  "tecnicoNome": "",
  "tipoManutencao": "",
  "obsInicial": "",
  "itens": [
    {
      "texto": "",
      "secao": "",
      "resultado": "OK",
      "observacao": ""
    }
  ],
  "assinatura": "",
  "dataHora": "",
  "dataHoraLocal": "",
  "codigoFormulario": ""
}
```

---

### calendario

Estrutura:

```json
{
  "maquinaNome": "",
  "proximaManutencao": "",
  "intervaloMeses": 6
}
```

---

# Pesquisa de Máquinas

Disponível para o perfil Técnico.

Critérios:

* Nome da máquina
* Setor

A filtragem ocorre em tempo real após carregamento dos registros do Firestore.

---

# Checklists

## Organização

Os itens são agrupados por:

```text
secao
```

Cada item possui:

```json
{
  "secao": "",
  "texto": ""
}
```

## Resultado

Cada item pode ser marcado como:

* OK
* NOK

Quando NOK:

* Observação obrigatória

---

# Assinatura Digital

Implementada utilizando:

```text
HTML5 Canvas
```

Compatível com:

* Mouse
* Touchscreen
* Smartphones
* Tablets

Armazenamento:

```text
Base64
```

---

# Modal de Detalhes

Disponível para gestores.

Exibe:

* Código do formulário
* Máquina
* Setor
* Técnico
* Tipo de manutenção
* Data
* Observações iniciais
* Itens do checklist
* Itens NOK
* Observações NOK
* Assinatura

Permite download direto do PDF.

---

# Dashboard do Gestor

Indicadores calculados:

* Total de manutenções
* Manutenções filtradas
* Registros com NOK
* Máquinas únicas atendidas

---

# Exportação CSV

Formato:

```text
CSV
```

Separador:

```text
;
```

Campos exportados:

* Código
* Data/Hora
* Máquina
* Setor
* Técnico
* Tipo
* Total de Itens
* Itens OK
* Itens NOK
* Observações Iniciais
* Detalhes dos Itens NOK

---

# Calendário Preventivo

Cada máquina possui:

* Próxima manutenção
* Intervalo em meses

O administrador pode:

* Alterar datas
* Alterar intervalos
* Salvar alterações diretamente no Firestore

---

# Envio de Email

Serviço:

```text
Brevo
```

Fluxo:

1. Manutenção finalizada
2. Registro salvo no Firestore
3. PDF gerado
4. Email enviado automaticamente
5. PDF anexado ao email

Conteúdo enviado:

* Dados da manutenção
* Código do formulário
* PDF assinado

---

# Segurança Atual

O sistema utiliza autenticação simples baseada em senha definida no frontend.

Não utiliza:

* Firebase Authentication
* Controle granular de usuários
* Perfis por banco de dados

As senhas encontram-se diretamente no código-fonte.

---

# Como Atualizar o Sistema

1. Abrir o repositório GitHub
2. Editar o arquivo `index.html`
3. Realizar commit
4. Aguardar publicação automática do GitHub Pages

---

# Como Executar Scripts Firebase

1. Abrir o sistema no navegador
2. Pressionar F12
3. Abrir Console
4. Executar o script necessário
5. Restaurar regras padrão após alterações administrativas

---

# Responsabilidade do Sistema

Garantir rastreabilidade, padronização e armazenamento centralizado das atividades de manutenção industrial da Fluortech, reduzindo falhas operacionais e facilitando auditorias, análises históricas e controle preventivo dos equipamentos.
