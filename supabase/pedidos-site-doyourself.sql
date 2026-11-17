-- ============================================================
-- Do Yourself — pedidos do site (página contratar.html)
-- Rodar no SQL Editor do Supabase DEPOIS de revisar.
-- O site usa só a chave PUBLICÁVEL (anon): ela NÃO lê nem escreve
-- na tabela direto; só consegue chamar as duas funções abaixo.
-- ============================================================

create table if not exists public.pedidos_site_doyourself (
  id                 text primary key check (id ~ '^DY-[0-9]{6}-[A-Z0-9]{4}$'),
  etapa              text not null check (etapa in ('contato', 'cadastro', 'pedido_criado')),
  origem             text,
  nome               text,
  telefone           text,
  email              text,
  cpf                text,
  cnpj               text,
  endereco           jsonb,
  fibra_viabilidade  text,
  itens              jsonb,          -- produtos escolhidos (plano, linhas, conta de luz, cashback em centavos)
  cashback_total     numeric(10,2),
  pagamento          jsonb,          -- { tipo: debito|boleto, banco }
  consentimento      boolean default false,
  utm                jsonb,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);
create index if not exists pedidos_site_dy_tel_idx on public.pedidos_site_doyourself (telefone);
create index if not exists pedidos_site_dy_criado_idx on public.pedidos_site_doyourself (criado_em desc);

alter table public.pedidos_site_doyourself enable row level security;
-- Sem nenhuma policy para anon/authenticated: ninguém do site lê a tabela.
-- O painel (Gabriel + sócio) e o n8n usam a service_role, que ignora o RLS.

-- Grava ou atualiza o pedido (o site chama 3 vezes: contato → cadastro → pedido criado)
create or replace function public.registrar_pedido_site(p_pedido jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := p_pedido->>'id';
begin
  if v_id is null or v_id !~ '^DY-[0-9]{6}-[A-Z0-9]{4}$' then raise exception 'id invalido'; end if;
  if length(p_pedido::text) > 20000 then raise exception 'pedido grande demais'; end if;

  insert into pedidos_site_doyourself as p (id, etapa, origem, nome, telefone, email, cpf, cnpj, endereco, fibra_viabilidade, itens, cashback_total, pagamento, consentimento, utm)
  values (
    v_id, p_pedido->>'etapa', left(p_pedido->>'origem', 20),
    nullif(left(p_pedido->>'nome', 120), ''), nullif(regexp_replace(coalesce(p_pedido->>'telefone', ''), '\D', '', 'g'), ''),
    nullif(left(lower(p_pedido->>'email'), 150), ''), nullif(regexp_replace(coalesce(p_pedido->>'cpf', ''), '\D', '', 'g'), ''),
    nullif(regexp_replace(coalesce(p_pedido->>'cnpj', ''), '\D', '', 'g'), ''),
    p_pedido->'endereco', p_pedido->>'fibra_viabilidade', p_pedido->'itens',
    coalesce((p_pedido->>'cashback_total_centavos')::numeric, 0) / 100,
    p_pedido->'pagamento', coalesce((p_pedido->>'consentimento')::boolean, false), p_pedido->'utm'
  )
  on conflict (id) do update set
    etapa = excluded.etapa,
    nome = coalesce(excluded.nome, p.nome), telefone = coalesce(excluded.telefone, p.telefone),
    email = coalesce(excluded.email, p.email), cpf = coalesce(excluded.cpf, p.cpf), cnpj = coalesce(excluded.cnpj, p.cnpj),
    endereco = excluded.endereco, fibra_viabilidade = excluded.fibra_viabilidade, itens = excluded.itens,
    cashback_total = excluded.cashback_total, pagamento = excluded.pagamento,
    consentimento = excluded.consentimento or p.consentimento, utm = coalesce(p.utm, excluded.utm),
    atualizado_em = now()
  -- não deixa um pedido já criado voltar de etapa nem ser reescrito depois de 2 horas
  where p.etapa <> 'pedido_criado' and p.criado_em > now() - interval '2 hours';
end;
$$;

-- Consulta de viabilidade de fibra → 'sim' | 'nao' | 'talvez'
-- ⚠️ AJUSTAR para a tabela real da superlista (nome e colunas). Abaixo, o modelo da wiki: viabilidade_fibra(cep, numero, tem_viabilidade).
create or replace function public.consultar_viabilidade_fibra(p_cep text, p_numero text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare v boolean;
begin
  select tem_viabilidade into v
  from viabilidade_fibra
  where cep = regexp_replace(p_cep, '\D', '', 'g')
    and (numero is null or numero = p_numero)
  order by (numero is not null) desc
  limit 1;
  if v is null then return 'talvez'; end if;
  return case when v then 'sim' else 'nao' end;
end;
$$;

revoke all on function public.registrar_pedido_site(jsonb) from public;
revoke all on function public.consultar_viabilidade_fibra(text, text) from public;
grant execute on function public.registrar_pedido_site(jsonb) to anon;
grant execute on function public.consultar_viabilidade_fibra(text, text) to anon;
