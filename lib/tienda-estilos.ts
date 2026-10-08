// CSS de la tienda basado en GLAXON. Todos los colores, fuentes y formas salen de
// variables (--p, --bg, --ft, --r...) que el renderizador define según el tema.
export const CSS_TIENDA = String.raw`
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;background:var(--bg)}
body{background:var(--bg);color:var(--tx);font-family:var(--fb);max-width:1300px;margin:0 auto;overflow-x:hidden;line-height:1.4}
img{max-width:100%}
a{color:inherit}
.titulo-fuente{font-family:var(--ft);text-transform:var(--tt)}

/* ===== HERO ===== */
header.hero{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;background:var(--bg)}
.hero-centrado{min-height:100vh}
.hero-compacto{min-height:62vh}
.hero-dividido{min-height:88vh}
.hero-bg{position:absolute;inset:0;pointer-events:none}
.efecto-brillo,.efecto-cuadricula,.efecto-puntos{background:radial-gradient(ellipse 80% 60% at 50% 40%,color-mix(in srgb,var(--p) 14%,transparent) 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 20% 80%,color-mix(in srgb,var(--acc) 8%,transparent) 0%,transparent 60%)}
.efecto-cuadricula::after{content:'';position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--p) 6%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--p) 6%,transparent) 1px,transparent 1px);background-size:60px 60px}
.efecto-puntos::after{content:'';position:absolute;inset:0;background-image:radial-gradient(color-mix(in srgb,var(--p) 22%,transparent) 1.5px,transparent 1.5px);background-size:26px 26px}
.hero-content{position:relative;z-index:2;padding:40px 20px;width:100%}
.hero-logo{max-height:90px;margin-bottom:20px;border-radius:var(--r)}
.hero-badge{display:inline-block;background:color-mix(in srgb,var(--p) 10%,transparent);border:1px solid color-mix(in srgb,var(--p) 30%,transparent);color:var(--p);font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;padding:8px 20px;border-radius:var(--rp);margin-bottom:30px;animation:fadeUp .8s ease both}
.hero h1{font-family:var(--ft);text-transform:var(--tt);font-size:var(--hero-size);line-height:.95;letter-spacing:var(--ls);color:var(--tx);animation:fadeUp .9s ease .1s both}
.hero h1 span{color:var(--p);display:block}
.hero-sub{font-size:clamp(16px,2vw,22px);color:var(--tx2);margin:25px 0 40px;font-weight:500;animation:fadeUp 1s ease .2s both}
.btn-hero{display:inline-flex;align-items:center;gap:10px;background:var(--p);color:var(--p-txt);padding:16px 40px;text-decoration:none;font-weight:700;font-size:16px;border-radius:var(--rp);transition:all .3s;animation:fadeUp 1s ease .3s both;letter-spacing:.5px}
.btn-hero:hover{transform:scale(1.05);box-shadow:0 0 40px color-mix(in srgb,var(--p) 40%,transparent)}
.btn-hero svg{width:18px;height:18px;transition:transform .3s}
.btn-hero:hover svg{transform:translateX(4px)}
.hero-stats{display:flex;gap:50px;justify-content:center;margin-top:60px;animation:fadeUp 1s ease .4s both;flex-wrap:wrap}
.hero-stat .num{font-family:var(--ft);font-size:36px;color:var(--p);line-height:1}
.hero-stat .lbl{font-size:12px;color:var(--tx2);letter-spacing:1px;text-transform:uppercase;margin-top:4px}
.hero-scroll{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);z-index:2;animation:scrollBounce 2s ease infinite}
.hero-scroll div{width:24px;height:40px;border:2px solid color-mix(in srgb,var(--p) 30%,transparent);border-radius:12px;position:relative}
.hero-scroll div::after{content:'';position:absolute;left:50%;top:6px;transform:translateX(-50%);width:4px;height:8px;background:var(--p);border-radius:2px;animation:scrollDot 2s ease infinite}
.hero-compacto .hero-scroll,.hero-dividido .hero-scroll{display:none}
.hero-dividido .hero-content{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;text-align:left;max-width:1200px}
.hero-dividido .hero-stats{justify-content:flex-start}
.hero-img{width:100%;max-height:520px;object-fit:cover;border-radius:calc(var(--r) * 1.5);box-shadow:0 30px 60px var(--sombra);animation:fadeUp 1s ease .2s both}
@keyframes scrollBounce{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes scrollDot{0%{top:6px;opacity:1}100%{top:20px;opacity:0}}

/* ===== FILTROS ===== */
.filtros-wrap{position:sticky;top:0;z-index:100;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(20px);border-bottom:1px solid color-mix(in srgb,var(--p) 12%,transparent);padding:15px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}
.filtros-wrap button{background:transparent;color:var(--tx2);border:1px solid var(--linea);padding:8px 18px;cursor:pointer;border-radius:var(--rp);font-family:var(--fb);font-weight:600;font-size:13px;transition:all .25s;white-space:nowrap}
.filtros-wrap button:hover,.filtros-wrap button.activo{background:var(--p);color:var(--p-txt);border-color:var(--p)}
.busqueda-wrap{display:flex;align-items:center;gap:8px;background:var(--suave);border:1px solid var(--linea);border-radius:var(--rp);padding:8px 16px}
.busqueda-wrap input{background:none;border:none;outline:none;color:var(--tx);font-family:var(--fb);font-size:13px;width:160px}
.busqueda-wrap input::placeholder{color:var(--tx2)}
.busqueda-wrap svg{width:14px;height:14px;flex-shrink:0;stroke:var(--tx2)}

/* ===== TÍTULOS DE SECCIÓN ===== */
.sec-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--p);margin-bottom:8px;font-weight:700}
.sec-title{font-family:var(--ft);text-transform:var(--tt);font-size:clamp(32px,5vw,56px);line-height:1.05;color:var(--tx);letter-spacing:var(--ls)}
.sec-centro{text-align:center}

/* ===== CATÁLOGO ===== */
.catalogo-wrap{padding:60px 20px}
.catalogo-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px;flex-wrap:wrap;gap:15px}
.catalogo-count{font-size:13px;color:var(--tx2)}
#productos{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px}

/* ===== TARJETAS (base "elevadas") ===== */
.producto,.bcard,.rec-card,.top-card,.duelo-card,.testimonio{background:var(--card);border:1px solid var(--linea);border-radius:var(--r);transition:all .35s ease}
.producto{overflow:hidden;position:relative;display:flex;flex-direction:column}
.producto:hover{transform:translateY(-6px);border-color:color-mix(in srgb,var(--p) 30%,transparent);box-shadow:0 20px 50px var(--sombra)}
.tarj-planas .producto,.tarj-planas .bcard,.tarj-planas .rec-card,.tarj-planas .top-card,.tarj-planas .duelo-card,.tarj-planas .testimonio{border-color:transparent;box-shadow:none}
.tarj-borde .producto,.tarj-borde .bcard,.tarj-borde .rec-card,.tarj-borde .top-card,.tarj-borde .duelo-card,.tarj-borde .testimonio{background:transparent;border-color:color-mix(in srgb,var(--tx) 18%,transparent)}
.prod-img-wrap{position:relative;background:linear-gradient(135deg,var(--bg2),var(--bg));padding:20px;overflow:hidden}
.producto img{width:100%;height:190px;object-fit:contain;transition:transform .4s ease}
.producto:hover img{transform:scale(1.08)}
.prod-cat{position:absolute;top:12px;left:12px;z-index:1;background:color-mix(in srgb,var(--p) 15%,var(--card));border:1px solid color-mix(in srgb,var(--p) 25%,transparent);color:var(--p);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:var(--rp)}
.prod-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:10px}
.prod-nombre{font-size:18px;font-weight:700;color:var(--tx);line-height:1.2}
.prod-desc{font-size:13px;color:var(--tx2);line-height:1.4}
.prod-precio{font-family:var(--ft);font-size:26px;color:var(--p);letter-spacing:1px}
.tallas-label{font-size:11px;color:var(--tx2);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.select-talla{width:100%;padding:8px 12px;border-radius:calc(var(--r) / 2);border:1px solid var(--linea);background:var(--bg2);color:var(--tx);font-family:var(--fb);font-size:13px;cursor:pointer;outline:none;transition:border-color .25s}
.select-talla:focus{border-color:var(--p)}
.btn-agregar{margin-top:auto;width:100%;padding:12px;background:color-mix(in srgb,var(--p) 12%,transparent);border:1px solid color-mix(in srgb,var(--p) 30%,transparent);color:var(--p);border-radius:calc(var(--r) * .65);font-family:var(--fb);font-weight:700;font-size:14px;cursor:pointer;transition:all .25s;letter-spacing:.5px}
.btn-agregar:hover,.btn-agregar.agregado{background:var(--p);color:var(--p-txt);border-color:var(--p)}
.btn-agregar:disabled{opacity:.55;cursor:not-allowed;background:transparent;color:var(--tx2);border-color:var(--linea)}
.producto.agotado img{opacity:.45;filter:grayscale(.6)}
.prod-stock{font-size:12px;font-weight:700;color:#e0663d;margin-top:-6px}

/* ===== CARRITO ===== */
.carrito-fab{position:fixed;top:20px;right:20px;z-index:1000;background:var(--p);color:var(--p-txt);width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 30px color-mix(in srgb,var(--p) 45%,transparent);transition:all .3s;border:none;font-size:20px}
.carrito-fab:hover{transform:scale(1.1)}
.carrito-badge{position:absolute;top:-4px;right:-4px;background:#ff4444;color:#fff;width:20px;height:20px;border-radius:50%;font-size:11px;font-weight:700;align-items:center;justify-content:center;display:none}
.carrito-panel{position:fixed;top:0;right:-400px;width:380px;height:100vh;background:var(--bg2);border-left:1px solid color-mix(in srgb,var(--p) 15%,transparent);z-index:1001;transition:right .4s cubic-bezier(.25,.46,.45,.94);display:flex;flex-direction:column}
.carrito-panel.abierto{right:0}
.panel-header{padding:25px 20px 20px;border-bottom:1px solid var(--linea);display:flex;align-items:center;justify-content:space-between}
.panel-header h3{font-family:var(--ft);text-transform:var(--tt);font-size:28px;color:var(--tx);letter-spacing:var(--ls)}
.btn-cerrar,.modal-cerrar{background:var(--suave);border:1px solid var(--linea);color:var(--tx2);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.btn-cerrar:hover,.modal-cerrar:hover{background:rgba(255,100,100,.2);color:#ff6666}
#lista-carrito{flex:1;overflow-y:auto;padding:15px 20px;list-style:none;display:flex;flex-direction:column;gap:10px}
.carrito-item{background:var(--suave);border:1px solid var(--linea);border-radius:calc(var(--r) * .75);padding:12px;display:flex;align-items:center;gap:12px}
.carrito-item img{width:48px;height:48px;object-fit:contain;background:color-mix(in srgb,var(--p) 6%,transparent);border-radius:8px;flex-shrink:0}
.ci-info{flex:1;min-width:0}
.ci-nombre{font-size:13px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ci-detalle{font-size:11px;color:var(--tx2);margin-top:3px}
.ci-cantidad{display:flex;align-items:center;gap:8px;margin-top:6px}
.ci-cantidad button{width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--p) 12%,transparent);border:1px solid color-mix(in srgb,var(--p) 30%,transparent);color:var(--p);font-size:13px;font-weight:700;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ci-cantidad button:hover{background:var(--p);color:var(--p-txt)}
.ci-cantidad span{font-size:13px;font-weight:700;color:var(--tx);min-width:14px;text-align:center}
.ci-precio{font-family:var(--ft);font-size:16px;color:var(--p);flex-shrink:0}
.btn-eliminar{background:none;border:none;color:rgba(255,100,100,.6);cursor:pointer;font-size:16px;flex-shrink:0;padding:2px}
.btn-eliminar:hover{color:#ff4444}
.panel-footer{padding:20px;border-top:1px solid var(--linea)}
.total-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:15px}
.total-lbl{font-size:13px;color:var(--tx2);text-transform:uppercase;letter-spacing:1px}
.total-monto{font-family:var(--ft);font-size:32px;color:var(--p)}
.panel-btns{display:flex;gap:10px}
.btn-vaciar{flex:1;padding:13px;background:rgba(255,100,100,.1);border:1px solid rgba(255,100,100,.25);color:#e05555;border-radius:calc(var(--r) * .65);font-family:var(--fb);font-weight:700;font-size:13px;cursor:pointer}
.btn-pagar{flex:2;padding:13px;background:var(--p);border:none;color:var(--p-txt);border-radius:calc(var(--r) * .65);font-family:var(--fb);font-weight:700;font-size:13px;cursor:pointer}
.carrito-vacio{text-align:center;padding:40px 20px;color:var(--tx2);font-size:14px}
.carrito-vacio .icono{font-size:40px;margin-bottom:10px}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;opacity:0;pointer-events:none;transition:opacity .4s}
.overlay.activo{opacity:1;pointer-events:all}

/* ===== BANNER ===== */
.banner-sec{margin:20px;border-radius:calc(var(--r) * 1.5);overflow:hidden;position:relative;padding:70px 40px;background:linear-gradient(135deg,var(--bg2),color-mix(in srgb,var(--p) 10%,var(--bg2)));border:1px solid color-mix(in srgb,var(--p) 12%,transparent)}
.banner-glow{position:absolute;width:500px;height:500px;background:radial-gradient(circle,color-mix(in srgb,var(--p) 16%,transparent),transparent 70%);top:-200px;left:-100px;pointer-events:none;animation:moverGlow 8s ease infinite alternate}
@keyframes moverGlow{from{transform:translate(0,0)}to{transform:translate(100px,80px)}}
.banner-content{position:relative;z-index:2;max-width:700px}
.banner-content h2{font-family:var(--ft);text-transform:var(--tt);font-size:clamp(32px,5vw,56px);line-height:1.05;color:var(--tx);margin-bottom:15px;letter-spacing:var(--ls)}
.banner-content h2 em{color:var(--p);font-style:normal}
.banner-content p{color:var(--tx2);font-size:16px;line-height:1.7;max-width:550px}
.banner-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:25px}
.chip{background:color-mix(in srgb,var(--p) 10%,transparent);border:1px solid color-mix(in srgb,var(--p) 22%,transparent);color:var(--p);font-size:12px;font-weight:600;padding:6px 14px;border-radius:var(--rp)}

/* ===== BENEFICIOS ===== */
.beneficios-sec,.recs-sec,.testimonios-sec,.horarios-sec,.seccion-personalizada{padding:60px 20px}
.beneficios-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:40px}
.bcard{padding:28px 24px;position:relative;overflow:hidden}
.bcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--p),transparent);opacity:0;transition:opacity .3s}
.bcard:hover{transform:translateY(-4px)}
.bcard:hover::before{opacity:1}
.bcard-icono{font-size:28px;margin-bottom:15px}
.bcard h3{font-size:18px;font-weight:700;color:var(--tx);margin-bottom:8px}
.bcard p{font-size:13px;color:var(--tx2);line-height:1.5}

/* ===== RECOMENDADOS / TOP ===== */
.recs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:15px;margin-top:40px}
.rec-card,.top-card{padding:16px;text-align:center;cursor:pointer}
.rec-card:hover{transform:translateY(-4px);box-shadow:0 10px 30px var(--sombra)}
.rec-card img{width:100%;height:130px;object-fit:contain;margin-bottom:10px}
.rec-card h4,.top-card h4{font-size:15px;font-weight:700;color:var(--tx);margin-bottom:6px}
.rec-precio{font-size:14px;color:var(--p);font-weight:700}
.top-sec{padding:0 20px 60px}
.top-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px;margin-top:40px}
.top-card{position:relative;border-color:color-mix(in srgb,var(--acc) 30%,transparent)}
.top-card:hover{transform:scale(1.04)}
.top-rank{position:absolute;top:-10px;left:-10px;width:32px;height:32px;background:gold;color:#000;border-radius:50%;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center}
.top-card:nth-child(2) .top-rank{background:#c0c0c0}
.top-card:nth-child(3) .top-rank{background:#cd7f32}
.top-card img{width:100%;height:100px;object-fit:contain;margin-bottom:10px}

/* ===== DUELO ===== */
.duelo-sec{padding:0 20px 60px}
.duelo-arena{margin-top:40px;display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center}
.duelo-card{padding:25px;text-align:center;cursor:pointer;position:relative;overflow:hidden}
.duelo-card:hover{transform:scale(1.04);border-color:color-mix(in srgb,var(--p) 45%,transparent);box-shadow:0 20px 50px var(--sombra)}
.duelo-card img{width:100%;max-height:170px;object-fit:contain;transition:transform .35s}
.duelo-nombre{font-size:20px;font-weight:700;color:var(--tx);margin-top:15px}
.duelo-precio{font-size:14px;color:var(--p);margin-top:5px}
.duelo-vs{font-family:var(--ft);font-size:48px;color:color-mix(in srgb,var(--tx) 18%,transparent);text-align:center}
.duelo-info{text-align:center;margin-top:20px;font-size:13px;color:var(--tx2);font-style:italic}

/* ===== TESTIMONIOS / HORARIOS ===== */
.testimonios-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:15px;margin-top:40px}
.testimonio{padding:24px}
.testimonio p{font-size:15px;color:var(--tx);line-height:1.6;margin-bottom:12px}
.testimonio p::before{content:'“';color:var(--p);font-size:28px;font-family:Georgia,serif;margin-right:4px}
.testimonio strong{font-size:13px;color:var(--p)}
.horarios-lista{list-style:none;margin-top:30px;display:grid;gap:10px;max-width:520px}
.horarios-lista li{background:var(--card);border:1px solid var(--linea);border-radius:calc(var(--r) * .75);padding:14px 18px;color:var(--tx)}

/* ===== FOOTER ===== */
footer{background:linear-gradient(135deg,var(--bg2),color-mix(in srgb,var(--p) 6%,var(--bg2)));border-top:1px solid color-mix(in srgb,var(--p) 12%,transparent);padding:50px 30px 30px;margin-top:30px}
.footer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;margin-bottom:40px}
.footer-marca h3{font-family:var(--ft);text-transform:var(--tt);font-size:38px;color:var(--p);letter-spacing:var(--ls);margin-bottom:10px}
.footer-marca p{font-size:13px;color:var(--tx2);line-height:1.6}
.footer-col h4{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--p);margin-bottom:15px}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.footer-col li{font-size:13px;color:var(--tx2)}
.footer-col a{text-decoration:none;transition:color .2s}
.footer-col a:hover{color:var(--p)}
.footer-bottom{border-top:1px solid var(--linea);padding-top:25px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;font-size:12px;color:var(--tx2)}

/* ===== MODAL PAGO ===== */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:2000;display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s}
.modal-overlay.activo{opacity:1;pointer-events:all}
.modal{background:var(--bg2);border:1px solid color-mix(in srgb,var(--p) 22%,transparent);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .35s cubic-bezier(.25,.46,.45,.94)}
.modal-overlay.activo .modal{transform:translateY(0)}
.modal-handle{width:40px;height:4px;background:var(--linea);border-radius:2px;margin:12px auto 0;flex-shrink:0}
.modal-head{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--linea);flex-shrink:0}
.modal-head h3{font-family:var(--ft);text-transform:var(--tt);font-size:26px;color:var(--tx);letter-spacing:var(--ls)}
.modal-body{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:14px}
.modal-total{display:flex;justify-content:space-between;align-items:center;background:color-mix(in srgb,var(--p) 7%,transparent);border:1px solid color-mix(in srgb,var(--p) 15%,transparent);border-radius:12px;padding:12px 16px}
.modal-total .tl{font-size:12px;color:var(--tx2);text-transform:uppercase;letter-spacing:1px}
.modal-total .tm{font-family:var(--ft);font-size:30px;color:var(--p)}
.pago-metodos{display:flex;gap:8px;flex-wrap:wrap}
.pago-metodo{flex:1;min-width:80px;background:var(--suave);border:1px solid var(--linea);border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;transition:all .25s}
.pago-metodo:hover,.pago-metodo.sel{background:color-mix(in srgb,var(--p) 12%,transparent);border-color:color-mix(in srgb,var(--p) 45%,transparent)}
.pm-icono{font-size:20px;margin-bottom:4px}
.pm-nombre{font-size:11px;font-weight:700;color:var(--tx)}
.pago-datos{background:color-mix(in srgb,var(--p) 6%,transparent);border:1px solid color-mix(in srgb,var(--p) 15%,transparent);border-radius:12px;padding:14px;text-align:center}
.pd-label{font-size:10px;color:var(--tx2);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
.pd-numero{font-family:var(--ft);font-size:30px;letter-spacing:3px;color:var(--p)}
.pd-nombre{font-size:12px;color:var(--tx2)}
.btn-copiar{background:color-mix(in srgb,var(--p) 12%,transparent);border:1px solid color-mix(in srgb,var(--p) 25%,transparent);color:var(--p);padding:5px 14px;border-radius:100px;font-family:var(--fb);font-size:11px;font-weight:700;cursor:pointer;margin-top:8px}
.pasos{display:flex;flex-direction:column;gap:6px}
.paso{display:flex;align-items:center;gap:10px;background:var(--suave);border-radius:10px;padding:10px 12px}
.paso-num{width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--p) 15%,transparent);border:1px solid color-mix(in srgb,var(--p) 30%,transparent);color:var(--p);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.paso-txt{font-size:12px;color:var(--tx2);line-height:1.4}
.paso-txt strong{color:var(--tx)}
.modal-foot{padding:12px 20px 20px;border-top:1px solid var(--linea);display:flex;flex-direction:column;gap:8px;flex-shrink:0}
.btn-wsp{width:100%;padding:14px;background:var(--p);border:none;color:var(--p-txt);border-radius:12px;font-family:var(--fb);font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.btn-seguir{width:100%;padding:11px;background:transparent;border:1px solid var(--linea);color:var(--tx2);border-radius:12px;font-family:var(--fb);font-weight:600;font-size:13px;cursor:pointer}

.fly-img{position:fixed;object-fit:contain;pointer-events:none;z-index:3000;transition:all .7s cubic-bezier(.25,.46,.45,.94);border-radius:8px}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.sin-resultados{grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--tx2)}
.sin-resultados h3{font-family:var(--ft);font-size:32px;color:color-mix(in srgb,var(--tx) 18%,transparent);margin-bottom:8px}

/* ===== NIVELES DE ANIMACIÓN ===== */
.anim-media .banner-glow{animation:none}
.anim-media .producto:hover,.anim-media .duelo-card:hover,.anim-media .top-card:hover{transform:translateY(-3px)}
.anim-baja *,.anim-baja *::before,.anim-baja *::after{animation:none!important}
.anim-baja .producto:hover,.anim-baja .bcard:hover,.anim-baja .rec-card:hover,.anim-baja .top-card:hover,.anim-baja .duelo-card:hover,.anim-baja .btn-hero:hover{transform:none}
.anim-baja .producto:hover img,.anim-baja .duelo-card:hover img{transform:none}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .hero-dividido .hero-content{grid-template-columns:1fr;text-align:center}
  .hero-dividido .hero-stats{justify-content:center}
  .hero-img{max-height:300px}
  .duelo-arena{grid-template-columns:1fr;gap:15px}
  .duelo-vs{font-size:32px}
  .hero-stats{gap:20px}
  .hero-stat .num{font-size:28px}
  .filtros-wrap{padding:10px 12px;gap:6px;overflow-x:auto;flex-wrap:nowrap;justify-content:flex-start}
  .filtros-wrap::-webkit-scrollbar{display:none}
  .filtros-wrap button{flex-shrink:0;font-size:12px;padding:7px 14px}
  .busqueda-wrap{flex-shrink:0}
  .busqueda-wrap input{width:90px}
  .banner-sec{padding:35px 20px;margin:12px}
  .carrito-panel{width:100vw;right:-100vw}
  .catalogo-wrap{padding:40px 15px}
  #productos{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
  .prod-img-wrap{padding:14px}
  .producto img{height:150px}
  .prod-nombre{font-size:15px}
  .prod-precio{font-size:22px}
  .beneficios-grid{grid-template-columns:1fr 1fr}
  .recs-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .top-grid{grid-template-columns:repeat(3,1fr)}
  .footer-grid{grid-template-columns:1fr 1fr;gap:25px}
  .btn-hero{padding:13px 28px;font-size:14px}
}
@media(max-width:420px){
  #productos{grid-template-columns:repeat(2,1fr)}
  .beneficios-grid{grid-template-columns:1fr}
  .top-grid{grid-template-columns:repeat(2,1fr)}
  .footer-grid{grid-template-columns:1fr}
}
`;
