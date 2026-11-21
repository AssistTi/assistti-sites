# AssistTI Sites

Plataforma de edição visual e gestão de múltiplos sites, hospedada no GitHub Pages, com autenticação e dados armazenados no Supabase.

## Endereços

- Login: `/login.html`
- Painel de administração e clientes: `/dashboard.html`
- Editor com drag-and-drop: `/editor-pro.html?site=<uuid>`
- Recuperação de senha: `/redefinir-senha.html`
- Editor antigo preservado: `/editor-legado.html`

O arquivo `index.html` redireciona para o login.

## O que funciona

- Login por e-mail e senha com Supabase Auth
- Painel responsivo para administradores e clientes
- Gestão de sites e repositórios vinculados
- Contas de clientes que se cadastram via login
- Atribuição e revogação de permissão por site com políticas RLS
- Editor visual GrapesJS, blocos, estilos e ajustes para dispositivos
- Upload de imagens para biblioteca por site (JPG, PNG, GIF, WEBP, máximo 8 MB; arquivos públicos)
- Importar HTML de arquivo ou de repositório GitHub público
- Salvar rascunhos e versões anteriores no Supabase
- Restaurar rascunhos pelo histórico e exportar HTML

## Ainda não implementado

- Publicação automática direta no GitHub, sem baixar HTML
- Edição fiel de scripts JavaScript externos ou interações complexas de HTML importado
- Provisionamento administrativo de contas por convite sem autocadastro
- Domínios customizados ou deploy de vários arquivos de um só site
- Editor equivalente à totalidade do Elementor/Wix

**O botão Publicar permanece indisponível até existir um serviço seguro de publicação.** Não coloque tokens de GitHub ou chaves service_role no JavaScript ou no repositório público.

## Primeiro uso

1. No login, entre com uma conta confirmada no Supabase.
2. O primeiro administrador foi configurado no banco de dados.
3. Abra o painel e selecione **Meus sites**.
4. Abra o editor e salve um rascunho no Supabase.
5. Para liberar um cliente, envie o link do login para que crie a conta e confirme o e-mail. Depois, entre em **Permissões**, selecione o cliente e libere os sites desejados.

## Segurança

- Banco com RLS em todas as tabelas públicas do sistema
- Autorização de edição por site
- Chave pública do Supabase no frontend; nenhuma chave secreta exposta
- Dados e imagens de projetos preservados no Supabase
- Biblioteca de imagens de sites é pública após upload
- Revisão periódica de permissões recomendada

Obs.: O projeto Supabase ainda aponta um aviso opcional de proteção contra senhas vazadas desativada. Ative-a no painel Auth se estiver disponível no plano.


## Publicação direta no GitHub

A Edge Function `publish-site` está implantada no Supabase e conectada ao botão **Publicar** do editor.

### Último passo: autorizar a função

1. Abra https://github.com/settings/personal-access-tokens/new
2. Escolha um token **Fine-grained**, proprietário `AssistTi`, acesso **Only select repositories** e selecione `treino-magnetico` (ou outros repositórios necessários).
3. Em **Repository permissions**, libere **Contents: Read and write**. Escolha validade limitada.
4. Abra https://supabase.com/dashboard/project/tlverdwpewfoxbojyxqf/functions/secrets
5. Crie o segredo `GITHUB_PUBLISH_TOKEN` e cole o token **somente no campo de segredos do Supabase**.
6. Abra **Painel > Publicações** para verificar o status e depois entre no editor do site.

A função exige autenticação Supabase, consulta o papel e as permissões por site, lê apenas o rascunho guardado no banco e cria uma **branch de backup antes de qualquer substituição de index.html**. O GitHub Pages publica após a atualização no repositório.

Nunca copie esse token para `auth-config.js`, arquivos HTML, código versionado ou conversas.

**Limitação importante:** o editor visual importa HTML, mas remove JavaScript de páginas importadas. Publicar o rascunho importado pode substituir scripts, checkout, animações e outras funções do site original. Revise a página integralmente e confirme antes de publicar, especialmente em sites já ativos.

### Segurança e verificação

- A função responde `GITHUB_SECRET_MISSING` até a credencial ser adicionada.
- Clientes sem permissão `can_publish` recebem recusa de publicação.
- O painel não apresenta sucesso antes de o GitHub confirmar o commit.
- O backup é criado antes de cada publicação.
- O token deve ser restrito aos repositórios necessários e rotacionado antes de expirar.
- A função foi implantada, mas não houve teste completo de publicação porque o segredo do GitHub ainda não está configurado.
