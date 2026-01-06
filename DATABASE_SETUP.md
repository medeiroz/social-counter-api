# Database Migrations and Seed

## Automated Setup

O Docker agora executa automaticamente:

1. **Migrations** - `prisma migrate deploy`
2. **Seed** - `npm run db:seed` (se necessário)
3. **Application Start** - `node dist/index.js`

## Processo no Dockerfile

O `docker-entrypoint.sh` executa na inicialização do container:

```bash
🔄 Running database migrations...
🌱 Running database seed...
✅ Database setup complete
🚀 Starting application...
```

## Benefícios

✅ **Zero-downtime deploys**: Migrations aplicadas antes do app iniciar  
✅ **Idempotente**: Seguro executar múltiplas vezes  
✅ **Automático**: Sem necessidade de comandos manuais  
✅ **Logs claros**: Indica cada etapa do processo

## Desenvolvimento Local

Para desenvolvimento, continue usando:

```bash
npm run db:migrate    # Cria e aplica nova migration
npm run db:seed       # Popula dados iniciais
npm run dev           # Inicia aplicação
```

## Produção

No deploy (Coolify/Docker):

1. Container builda com `Dockerfile`
2. Na inicialização:
   - Migrations são aplicadas automaticamente
   - Seed roda se necessário (falha silenciosa se já existir)
   - App inicia após banco estar pronto
3. Health check valida se app está respondendo

## Troubleshooting

Se migrations falharem, o container não inicia (fail-fast).

Para ver logs:
```bash
docker logs <container-id>
```

Para aplicar migrations manualmente:
```bash
docker exec <container-id> npx prisma migrate deploy
```
