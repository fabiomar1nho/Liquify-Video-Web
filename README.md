# Liquify

Editor de **fotos e vídeos** no navegador para **remodelagem corporal localizada**, no estilo da ferramenta *Liquify* do Photoshop, aplicada a vídeos. Você pinta sobre uma região (por exemplo, uma panturrilha), e a deformação acompanha essa região durante o vídeo.

Tudo roda localmente no navegador, em um único arquivo (`index.html`), sem servidor e sem enviar o vídeo para lugar nenhum.

> **Status:** protótipo funcional. A deformação em tempo real e a exportação estão implementadas; o rastreamento é baseado em visão computacional simples (veja [Limitações](#limitações)).

## Recursos

- **Ferramentas de deformação (WebGL2):**
  - **Grow:** aumenta o volume da região.
  - **Shrink:** diminui o volume da região.
  - **Push:** empurra o contorno arrastando o dedo ou o mouse.
  - **Smooth:** suaviza deformações já feitas.
- **Pincel:** tamanho, intensidade e suavidade (borda), com cursor circular que mostra o diâmetro e a zona de transição; ao ajustar tamanho ou suavidade, o círculo aparece no centro do vídeo como prévia. A mesma curva de suavização vale para Grow, Shrink, Push e Smooth.
- **Desfazer/Refazer** por traço (`Ctrl+Z` / `Ctrl+Y`).
- **Rastreamento da região:** acompanha dois pontos da região pintada por correspondência de blocos (estilo fluxo óptico), estimando posição, rotação e escala, com suavização temporal para o tamanho não oscilar.
- **Linha do tempo:** reprodução, velocidade (0.25× a 2×), navegação quadro a quadro, marcadores (tecla `M`; clique longo/direito remove).
- **Comparação:** botão *Original/Editado* e tela dividida com linha arrastável.
- **Exportação quadro a quadro:** MP4 (H.264 + AAC) via WebCodecs e [mp4-muxer](https://github.com/Vanilagy/mp4-muxer), na resolução original ou limitada a 1080p, com a taxa de quadros e o áudio originais, barra de progresso e botão de cancelar.
- **Mobile:** layout com vídeo no topo e barra de ferramentas embaixo, botões de pelo menos 44×44 px, ajustes numa gaveta recolhível, pintura por toque e navegação com dois dedos.

## Tela inicial e modos

Ao abrir, a tela inicial oferece **Importar Imagem** (JPG, PNG, WebP) e **Importar Vídeo** (MP4, WebM etc.) e depois faz um fade para o editor. Imagens usam as mesmas ferramentas, sem linha do tempo nem rastreamento, e exportam em PNG. O botão de upload no canto do vídeo volta à tela inicial para trocar de mídia.

## Conferir o rastreamento

Depois de **Rastrear**, o vídeo mostra os pontos seguidos (1 e 2), a linha tracejada entre eles e a trajetória: o trecho já percorrido em cor forte e o restante esmaecido. O botão de olho no canto liga e desliga essa marcação, que nunca aparece no vídeo exportado.

## Instalar como app (PWA)

Estrutura de arquivos na raiz do site:

```
index.html
manifest.json
sw.js            # opcional, habilita uso offline
icons/
  icon-192.png            # 192x192, purpose "any"
  icon-512.png            # 512x512, purpose "any"
  icon-maskable-192.png   # 192x192, purpose "maskable"
  icon-maskable-512.png   # 512x512, purpose "maskable"
```
## Notch e barra de status

O layout usa `viewport-fit=cover` e margens com `env(safe-area-inset-*)`. Em telas de toque, o topo ganha no mínimo 16 px de respiro, e o cabeçalho tem espaçamento interno próprio, então logo e botões não ficam sob o notch ou a ilha dinâmica.

## Como executar

Não há build nem dependências para instalar.

1. Salve o arquivo como `index.html`.
2. Abra no **Chrome** ou **Edge** (recomendado).

Para testar no celular pela rede local, sirva a pasta:

```bash
python3 -m http.server 8000
# abra http://<IP-do-computador>:8000 no celular
```

Para publicar, use o GitHub Pages (Settings → Pages → branch `main`, pasta `/root`).

> A exportação carrega o `mp4-muxer` de uma CDN (jsDelivr), então precisa de internet na primeira vez. Para uso offline, baixe `mp4-muxer@5.1.3/build/mp4-muxer.js` e troque a tag `<script>` no `<head>` por um caminho local.

## Como usar

1. **Importar** um vídeo.
2. Escolher **Grow**, **Shrink**, **Push** ou **Smooth** e **pintar** sobre a região desejada.
3. Abrir **Ajustes** para mudar tamanho, intensidade, suavidade e força total.
4. Tocar em **Rastrear** para a deformação acompanhar o movimento.
5. **Reproduzir** e conferir; usar **Original** e **Dividir** para comparar.
6. **Exportar**.

### Gestos (celular)

| Gesto | Ação |
| --- | --- |
| Um dedo no vídeo | Pintar com a ferramenta selecionada |
| Dois dedos arrastando na horizontal | Voltar/avançar quadro a quadro (o traço em andamento é cancelado) |
| Arrastar a linha verde | Mover a divisão Antes/Depois |

O canvas usa `touch-action: none` e bloqueia o comportamento padrão de toque, então pintar não rola nem dá zoom na página.

## Como funciona

| Etapa | Técnica |
| --- | --- |
| Deformação | Um campo de deslocamento 256×256 (float32) é ajustado a cada traço e lido por um shader de mapeamento reverso. Fora do raio do pincel o deslocamento é zero, o que preserva o fundo. |
| Rastreamento | Dois blocos na região pintada são seguidos quadro a quadro (SAD com refinamento subpixel e correção de deriva pelo quadro de referência). Posição, rotação e escala vêm da transformação de similaridade entre os dois pontos. Os resultados são suavizados por média móvel. |
| Exportação | Para cada quadro o vídeo é posicionado no instante exato, o shader é aplicado e o canvas é codificado com `VideoEncoder`. O áudio é decodificado e codificado em AAC, e tudo é gravado em MP4. |

## Limitações

- **Rastreamento simples:** não usa pose corporal. Pele lisa, oclusões e movimentos muito rápidos podem fazer o ponto se perder. Nesse caso, use *Limpar tudo*, pinte de novo e rastreie.
- **Sem segmentação do corpo:** a preservação do fundo vem só do pincel localizado e suave; junto à borda da perna o fundo pode esticar um pouco.
- **Uma região rastreada por vez:** a transformação de rastreamento vale para todas as pinceladas.
- **Exportação:** exige WebCodecs (Chrome/Edge atuais). Em outros navegadores o app faz um modo alternativo, gravando em tempo real, em MP4 ou WebM conforme o suporte. Vídeos muito longos ou em 4K consomem bastante memória.
- Se o áudio não puder ser decodificado, o MP4 sai sem som.

## Próximos passos

- Ancorar a região em pontos da perna com **MediaPipe Pose**.
- Segmentação da pessoa para proteger o fundo.
- Exportação com **FFmpeg.wasm** para mais formatos e controle de bitrate.
- Keyframes de intensidade ao longo da linha do tempo.
- Projeto em React + TypeScript com Web Workers para o rastreamento.

## Compatibilidade

| Navegador | Edição | Exportação MP4 quadro a quadro |
| --- | --- | --- |
| Chrome / Edge (desktop e Android) | Sim | Sim |
| Safari (iOS/macOS) | Sim | Depende da versão (WebCodecs) |
| Firefox | Sim | Modo alternativo |

## Créditos

Os ícones são do [Lucide](https://lucide.dev) (licença ISC), embutidos no próprio arquivo como SVG, então não dependem de CDN.

## Licença

MIT. Use e modifique à vontade.
