# Instagram Token Auto-Refresh

## Configuração

Para habilitar a atualização automática do token do Instagram, adicione estas variáveis no `.env`:

```env
INSTAGRAM_APP_ID="seu_app_id_aqui"
INSTAGRAM_APP_SECRET="seu_app_secret_aqui"
```

O token é armazenado no **banco de dados** na tabela `platform_tokens` com data de expiração.

## Como obter APP_ID e APP_SECRET

1. Acesse [Facebook for Developers](https://developers.facebook.com/)
2. Vá em **My Apps** e selecione seu app
3. No menu lateral, clique em **Settings** > **Basic**
4. Copie:
   - **App ID** → `INSTAGRAM_APP_ID`
   - **App Secret** → Clique em "Show" e copie → `INSTAGRAM_APP_SECRET`

## Como funciona

### Armazenamento no Banco de Dados
- ✅ Token salvo na tabela `platform_tokens`
- ✅ Data de expiração rastreada automaticamente
- ✅ Migração automática do `.env` para o banco na primeira execução
- ✅ Sincronização entre múltiplas instâncias da API

### Verificação Automática
- ✅ Verifica o token a cada **24 horas**
- ✅ Renova automaticamente se faltar menos de **15 dias** para expirar
- ✅ Atualiza o banco de dados com o novo token
- ✅ Registra todas as operações no console

### Renovação Manual

#### Via API (Recomendado)
Crie um endpoint admin para renovar manualmente:

```typescript
import { InstagramTokenRefreshService } from './services/instagram-token-refresh.service';

app.post('/api/admin/refresh-instagram-token', authenticateApiKey, async (req, res) => {
  try {
    const service = new InstagramTokenRefreshService();
    const newToken = await service.refreshToken();
    res.json({ message: 'Token refreshed successfully', expiresAt: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Via CLI
```bash
curl -X POST http://localhost:3000/api/admin/refresh-instagram-token \
  -H "X-API-Key: your-api-key"
```

## Primeiro Uso

Na primeira vez que a API iniciar com o token no `.env`, ele será **migrado automaticamente** para o banco de dados:

```
⚠️  Using token from .env (consider migrating to database)
✅ Token migrated from .env to database
```

Após isso, o `.env` pode ter a variável `INSTAGRAM_ACCESS_TOKEN` removida (opcional).

## Logs do Sistema

Quando o serviço está ativo:

```
🚀 Starting Instagram token periodic check (every 24 hours)
✅ Token is still valid
```

Quando renovar:

```
⚠️  Token is expiring soon, refreshing...
🔄 Refreshing Instagram access token...
✅ Instagram access token refreshed successfully
📅 New token expires at: 2026-03-07T18:00:00.000Z
```

## Estrutura do Banco

```sql
CREATE TABLE platform_tokens (
  id         TEXT PRIMARY KEY,
  platform   TEXT UNIQUE NOT NULL,  -- 'instagram', 'youtube', etc
  token      TEXT NOT NULL,
  expiresAt  TIMESTAMP NOT NULL,
  createdAt  TIMESTAMP DEFAULT NOW(),
  updatedAt  TIMESTAMP DEFAULT NOW()
);
```

## Benefícios

✅ **Multi-instância**: Todas as instâncias da API compartilham o mesmo token  
✅ **Rastreamento**: Data de expiração precisa  
✅ **Segurança**: Token não fica no código ou .env em produção  
✅ **Automático**: Sem necessidade de cronjobs externos  
✅ **Confiável**: Renova com 15 dias de antecedência

## Fallback

Se `INSTAGRAM_APP_ID` ou `INSTAGRAM_APP_SECRET` não estiverem configurados:
- ⏭️  O serviço será desabilitado automaticamente
- ⚠️  Você verá um aviso no console
- 🔄 A API continuará funcionando com o token atual do banco
- 📝 Você precisará renovar o token manualmente quando expirar

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o `.env` com credenciais reais
- Use variáveis de ambiente na produção
- Mantenha o `APP_SECRET` seguro
- O token no banco está acessível via conexão direta - configure permissões adequadas
