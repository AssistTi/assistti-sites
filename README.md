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
