# Instagram Graph API Setup

Para usar a API do Instagram, você precisa configurar o Instagram Graph API. Siga os passos abaixo:

## Pré-requisitos

1. **Conta Instagram Business ou Creator**: Sua conta Instagram deve ser uma conta Business ou Creator
2. **Página do Facebook**: A conta Instagram deve estar conectada a uma Página do Facebook
3. **Conta de Desenvolvedor Facebook**: Você precisa de uma conta no [Facebook for Developers](https://developers.facebook.com/)

## Passo a Passo

### 1. Criar um App no Facebook for Developers

1. Acesse [Facebook for Developers](https://developers.facebook.com/)
2. Clique em "My Apps" > "Create App"
3. Escolha o tipo "Business"
4. Preencha os detalhes do app
5. Após criar, vá em "Add Product" e adicione "Instagram Basic Display"

### 2. Configurar Instagram Basic Display

1. No painel do seu app, vá em "Instagram Basic Display" > "Basic Display"
2. Clique em "Create New App"
3. Preencha as informações necessárias
4. Em "Valid OAuth Redirect URIs", adicione: `https://localhost/`
5. Em "Deauthorize Callback URL", adicione: `https://localhost/`
6. Em "Data Deletion Request URL", adicione: `https://localhost/`
7. Salve as alterações

### 3. Adicionar Usuário de Teste (Instagram Tester)

1. Na seção "Instagram Basic Display", vá em "Roles" > "Instagram Testers"
2. Clique em "Add Instagram Testers"
3. Digite o nome de usuário da conta Instagram que você quer usar
4. A conta Instagram receberá uma notificação para aceitar o convite

**IMPORTANTE**: Acesse a conta Instagram, vá em Configurações > Apps e Sites > Tester Invites e aceite o convite.

### 4. Obter Access Token (Forma Simplificada)

Para obter um token de acesso de longa duração, você pode usar o **Graph API Explorer**:

1. Acesse o [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione seu app no dropdown "Facebook App"
3. Clique em "Generate Access Token"
4. Selecione as permissões necessárias:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_manage_insights` (se quiser insights)
5. Clique em "Generate Access Token" e autorize
6. Copie o token gerado

### 5. Converter para Long-Lived Token

O token gerado expira em 1 hora. Para converter em um token de longa duração (60 dias):

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Substitua:
- `YOUR_APP_ID`: ID do seu app (encontrado no Dashboard)
- `YOUR_APP_SECRET`: Secret do seu app (encontrado em Settings > Basic)
- `YOUR_SHORT_LIVED_TOKEN`: Token gerado no passo anterior

### 6. Obter Instagram Business Account ID

Com o long-lived token, você pode obter o ID da sua conta Instagram Business:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_LONG_LIVED_TOKEN"
```

Isso retornará as páginas do Facebook. Encontre a página conectada à sua conta Instagram e use o ID dela para obter o Instagram Business Account ID:

```bash
curl -X GET "https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_LONG_LIVED_TOKEN"
```

O `instagram_business_account.id` é o valor que você precisa.

### 7. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
INSTAGRAM_ACCESS_TOKEN="your_long_lived_access_token_here"
INSTAGRAM_BUSINESS_ACCOUNT_ID="your_instagram_business_account_id_here"
```

## Testando

Após configurar, teste com:

```bash
curl -X GET "http://localhost:3000/api/v1/instagram/account?username=TARGET_USERNAME" \
  -H "X-API-Key: your-api-key"
```

## Limitações

- **Business Discovery**: Só funciona para contas Instagram Business ou Creator públicas
- **Rate Limits**: A API do Facebook tem limites de taxa (rate limits)
- **Token Expiration**: Tokens de longa duração expiram em 60 dias e precisam ser renovados

## Renovação Automática de Token

Para renovar automaticamente o token antes de expirar, você pode fazer uma requisição a cada 30 dias:

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_CURRENT_TOKEN"
```

## Referências

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
- [Business Discovery](https://developers.facebook.com/docs/instagram-api/reference/ig-user/business_discovery)
