# Integrações Futuras

**Estado atual: nada implementado.** Este documento existe para que
decisões estruturais de hoje não bloqueiem integrações amanhã.

## Princípio

```
CRM externo → Adapter / Integration Layer → Nossa API → Modelo interno → Portal
```

Nunca o inverso. Nosso modelo (`docs/DATA_MODEL.md`) é soberano; um CRM
externo nunca é requisito para o funcionamento do produto.

## Local reservado (não implementado)

`/integrations/manual` — entrada manual (o que já existe via admin).
`/integrations/import` — importação pontual (CSV/JSON) de projetos.
`/integrations/atelie` — adapter específico para o CRM "Ateliê" (hipotético),
quando/se sua API estiver disponível.

Cada adapter deve traduzir o formato externo para os tipos em
`src/domain/types.ts` — nunca o contrário.

## API versionada (Milestone 7)

Route Handlers, não lógica espalhada em componentes:

- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `GET /api/v1/projects/:id/stages`
- `GET /api/v1/projects/:id/updates`

Autenticação via chave de API por organização (a definir — candidatos:
Supabase JWT customizado ou tabela `api_keys` com hash).

## Webhooks (documentados, não implementados)

Eventos candidatos: `project.created`, `project.updated`,
`project.published`, `stage.updated`, `update.created`. Formato e
assinatura (HMAC) a definir quando houver um primeiro consumidor real.
