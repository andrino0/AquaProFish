# AquaProFish

**Gestão • Criação • Comunidade**

Primeira versão visual e funcional do AquaProFish, uma plataforma para aquaristas e criadores de peixes ornamentais.

## Rodar localmente

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## O que já existe nesta primeira etapa

- Painel inicial com resumo dos aquários, peixes e tarefas.
- Cadastro local de aquários.
- Cadastro e pesquisa de peixes.
- Lista de cuidados com marcação de tarefas concluídas.
- Mural de comunidade em modo demonstração.
- Guia inicial com guppy, betta, platy, espada e molinésia.
- Layout responsivo para celular e computador.
- Dados salvos no navegador com localStorage.

## Importante: estado atual

Esta é uma **primeira versão de interface (MVP)**. Os dados ficam no navegador/dispositivo atual. Ainda não há cadastro real de usuários, sincronização entre dispositivos, mensagens privadas, upload de fotos, notificações automáticas ou comunidade online compartilhada.

Esses recursos serão conectados em uma próxima etapa com backend e banco de dados. Nenhuma chave secreta deve ser publicada neste repositório.

## Próximas etapas

1. Criar identidade visual final e ícones do aplicativo.
2. Configurar Supabase para autenticação, banco de dados e armazenamento de imagens.
3. Criar perfis, aquários e registros vinculados à conta do usuário.
4. Implementar reprodução, linhagens, parâmetros da água, saúde e tratamentos.
5. Implementar comunidade real com publicações, fotos, comentários, curtidas, mensagens e moderação.
6. Preparar instalação PWA e publicação no Netlify.

## APK

O deploy do Netlify baixa o APK mais recente publicado na release `apk-latest` do GitHub e o disponibiliza em `/download/AquaProFish.apk`.

## Licença

A definir pelo mantenedor do projeto.