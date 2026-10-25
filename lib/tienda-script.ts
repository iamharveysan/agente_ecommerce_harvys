// JavaScript que corre dentro de la tienda generada. Lee los datos de window.TIENDA_DATOS.
// Se escribe sin template literals para poder incrustarlo tal cual en el HTML exportado.
export const SCRIPT_TIENDA = String.raw`
(function(){
var D=window.TIENDA_DATOS;
var productos=D.productos;
var CLAVE=D.clave;

/* ===== ALMACENAMIENTO SEGURO ===== */
function leer(k,d){try{var v=JSON.parse(localStorage.getItem(CLAVE+k));return v==null?d:v}catch(e){return d}}
function escribir(k,v){try{localStorage.setItem(CLAVE+k,JSON.stringify(v))}catch(e){}}

function fmt(n){return "$"+Number(n).toLocaleString("es-CO")}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function porId(id){for(var i=0;i<productos.length;i++){if(productos[i].id===id)return productos[i]}return null}
function $(id){return document.getElementById(id)}
function numeroBonito(n){n=String(n||"").replace(/\D/g,"");return n.length===10?n.slice(0,3)+" "+n.slice(3,6)+" "+n.slice(6):n}

var BACKEND=D.backend||"";
var carrito=[];
var elos=leer("elo",{});
var categoriaActiva="Todos";

/* Unidades del mismo producto en el carrito (todas sus opciones) */
function enCarrito(id){return carrito.reduce(function(s,c){return s+(c.id===id?c.cantidad:0)},0)}
function hayStock(p,extra){return p.stock==null||enCarrito(p.id)+extra<=p.stock}

/* Enlaces internos (#seccion) con desplazamiento suave */
document.addEventListener("click",function(e){
  var a=e.target.closest?e.target.closest('a[href^="#"]'):null;
  if(!a)return;
  var h=a.getAttribute("href");
  if(h.length<2)return;
  var t=document.querySelector(h);
  if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"})}
});

/* ===== FILTROS ===== */
function crearFiltros(){
  var bar=$("filtros-bar");if(!bar)return;
  var cats=["Todos"];
  productos.forEach(function(p){if(cats.indexOf(p.categoria)<0)cats.push(p.categoria)});
  cats.forEach(function(c){
    var b=document.createElement("button");
    b.textContent=c;b.setAttribute("data-cat",c);
    if(c==="Todos")b.className="activo";
    b.onclick=function(){seleccionarCategoria(c)};
    bar.appendChild(b);
  });
}
function seleccionarCategoria(c){
  var bs=document.querySelectorAll("#filtros-bar button");
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle("activo",bs[i].getAttribute("data-cat")===c);
  categoriaActiva=c;aplicarFiltros();
}
function aplicarFiltros(){
  var q=(($("buscador")||{}).value||"").trim().toLowerCase();
  mostrarProductos(productos.filter(function(p){
    return (categoriaActiva==="Todos"||p.categoria===categoriaActiva)&&(!q||p.nombre.toLowerCase().indexOf(q)>=0);
  }));
}
function verProducto(id){
  var p=porId(id);if(!p||!$("buscador"))return;
  $("buscador").value=p.nombre;seleccionarCategoria("Todos");
  $("catalogo").scrollIntoView({behavior:"smooth"});
}

/* ===== PRODUCTOS ===== */
function mostrarProductos(lista){
  var cont=$("productos");if(!cont)return;
  cont.innerHTML="";
  $("cont-count").textContent=lista.length+" producto"+(lista.length!==1?"s":"");
  if(!lista.length){cont.innerHTML='<div class="sin-resultados"><h3>Sin resultados</h3><p>Intenta con otro término o categoría</p></div>';return}
  lista.forEach(function(p){
    var div=document.createElement("div");div.className="producto";
    var op=p.opciones&&p.opciones.valores&&p.opciones.valores.length?p.opciones:null;
    var opHTML=op?'<div><div class="tallas-label">'+esc(op.etiqueta)+'</div><select class="select-talla" aria-label="'+esc(op.etiqueta)+'"><option value="">Seleccionar</option>'+op.valores.map(function(v){return '<option>'+esc(v)+'</option>'}).join("")+'</select></div>':"";
    div.innerHTML='<div class="prod-img-wrap"><span class="prod-cat">'+esc(p.categoria)+'</span><img src="'+esc(p.imagen)+'" alt="'+esc(p.nombre)+'" loading="lazy"></div>'+
      '<div class="prod-body"><div class="prod-nombre">'+esc(p.nombre)+'</div>'+
      (p.descripcion?'<div class="prod-desc">'+esc(p.descripcion)+'</div>':"")+
      '<div class="prod-precio">'+fmt(p.precio)+'</div>'+opHTML+
      '<button class="btn-agregar">'+esc(D.botonAgregar)+'</button></div>';
    var btn=div.querySelector(".btn-agregar"),img=div.querySelector("img"),sel=div.querySelector(".select-talla");
    if(p.stock!=null&&p.stock<=0){div.classList.add("agotado");btn.disabled=true;btn.textContent="Agotado"}
    else if(p.stock!=null&&p.stock<=3){div.querySelector(".prod-precio").insertAdjacentHTML("afterend",'<div class="prod-stock">¡Solo quedan '+p.stock+'!</div>')}
    if(sel)sel.onchange=function(){sel.style.borderColor=""};
    btn.onclick=function(){
      var v=sel?sel.value:"";
      if(sel&&!v){sel.style.borderColor="#ff6666";sel.focus();return}
      if(!hayStock(p,1)){alert("Solo hay "+p.stock+" unidad"+(p.stock===1?"":"es")+" disponible"+(p.stock===1?"":"s")+" de "+p.nombre);return}
      agregarCarrito(p,v);animarVuelo(img);
      btn.classList.add("agregado");btn.textContent="✔ Agregado";
      setTimeout(function(){btn.classList.remove("agregado");btn.textContent=D.botonAgregar},1600);
    };
    // Lupa que sigue al cursor y visor en grande al hacer clic
    var wrap=div.querySelector(".prod-img-wrap");
    wrap.insertAdjacentHTML("beforeend",'<span class="prod-lupa" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></span>');
    wrap.addEventListener("mousemove",function(e){
      var r=wrap.getBoundingClientRect();
      img.style.transformOrigin=((e.clientX-r.left)/r.width*100)+"% "+((e.clientY-r.top)/r.height*100)+"%";
    });
    wrap.addEventListener("mouseleave",function(){img.style.transformOrigin=""});
    wrap.onclick=function(){abrirVisor(p)};
    cont.appendChild(div);
  });
}

/* ===== ANIMACIÓN AL CARRITO ===== */
function animarVuelo(imgEl){
  var fab=$("fab"),ir=imgEl.getBoundingClientRect(),fr=fab.getBoundingClientRect();
  var el=imgEl.cloneNode(true);el.className="fly-img";
  el.style.top=ir.top+"px";el.style.left=ir.left+"px";el.style.width=ir.width+"px";el.style.height=ir.height+"px";
  document.body.appendChild(el);
  setTimeout(function(){el.style.top=fr.top+"px";el.style.left=fr.left+"px";el.style.width="40px";el.style.height="40px";el.style.opacity="0.3"},50);
  setTimeout(function(){el.remove()},800);
}

/* ===== CARRITO ===== */
function agregarCarrito(p,opcion){
  var ex=null;
  carrito.forEach(function(c){if(c.id===p.id&&c.opcion===opcion)ex=c});
  if(ex)ex.cantidad++;else carrito.push({id:p.id,opcion:opcion,cantidad:1});
  guardar();actualizarCarrito();
  $("panel-carrito").classList.add("abierto");$("overlay").classList.add("activo");
  clearTimeout(window._ciTimer);window._ciTimer=setTimeout(cerrarCarrito,2500);
}
function totalCarrito(){return carrito.reduce(function(s,c){return s+porId(c.id).precio*c.cantidad},0)}
function unidades(){return carrito.reduce(function(s,c){return s+c.cantidad},0)}
function cambiarCantidad(i,d){
  var p=porId(carrito[i].id);
  if(d>0&&!hayStock(p,d)){alert("Solo hay "+p.stock+" unidades disponibles de "+p.nombre);return}
  carrito[i].cantidad+=d;if(carrito[i].cantidad<=0)carrito.splice(i,1);guardar();actualizarCarrito()}
function actualizarCarrito(){
  var lista=$("lista-carrito"),badge=$("badge"),u=unidades();
  lista.innerHTML="";badge.style.display=u?"flex":"none";badge.textContent=u;
  if(!carrito.length)lista.innerHTML='<div class="carrito-vacio"><div class="icono">🛒</div><p>Tu carrito está vacío</p></div>';
  carrito.forEach(function(c,i){
    var p=porId(c.id),et=p.opciones?p.opciones.etiqueta:"";
    var li=document.createElement("li");li.className="carrito-item";
    li.innerHTML='<img src="'+esc(p.imagen)+'" alt="'+esc(p.nombre)+'"><div class="ci-info"><div class="ci-nombre">'+esc(p.nombre)+'</div>'+
      '<div class="ci-detalle">'+(c.opcion?esc(et)+": "+esc(c.opcion)+" · ":"")+fmt(p.precio)+' c/u</div>'+
      '<div class="ci-cantidad"><button data-d="-1" aria-label="Quitar una unidad">−</button><span>'+c.cantidad+'</span><button data-d="1" aria-label="Agregar una unidad">+</button></div></div>'+
      '<div class="ci-precio">'+fmt(p.precio*c.cantidad)+'</div><button class="btn-eliminar" aria-label="Eliminar">✕</button>';
    var bs=li.querySelectorAll(".ci-cantidad button");
    for(var k=0;k<bs.length;k++){(function(b){b.onclick=function(){cambiarCantidad(i,+b.getAttribute("data-d"))}})(bs[k])}
    li.querySelector(".btn-eliminar").onclick=function(){cambiarCantidad(i,-c.cantidad)};
    lista.appendChild(li);
  });
  $("total").textContent=fmt(totalCarrito());
}
function guardar(){escribir("carrito",carrito)}
function vaciarCarrito(){carrito=[];guardar();actualizarCarrito()}
function toggleCarrito(){
  var p=$("panel-carrito"),o=$("overlay"),ab=p.classList.contains("abierto");
  p.classList.toggle("abierto",!ab);o.classList.toggle("activo",!ab);clearTimeout(window._ciTimer);
}
function cerrarCarrito(){$("panel-carrito").classList.remove("abierto");$("overlay").classList.remove("activo")}

/* ===== PAGO ===== */
var metodos=D.pagos.metodos||[];
var metodoSel=0;
function crearMetodos(){
  var cont=$("pago-metodos");
  metodos.forEach(function(m,i){
    var d=document.createElement("div");d.className="pago-metodo"+(i===0?" sel":"");
    d.innerHTML='<div class="pm-icono">'+esc(m.icono)+'</div><div class="pm-nombre">'+esc(m.nombre)+'</div>';
    d.onclick=function(){selMetodo(i)};cont.appendChild(d);
  });
  $("pd-numero").textContent=numeroBonito(D.pagos.numeroTransferencia);
  $("pd-nombre").textContent=D.pagos.titular||"";
  if(metodos.length)selMetodo(0);
}
function selMetodo(i){
  metodoSel=i;
  var ds=document.querySelectorAll(".pago-metodo");
  for(var k=0;k<ds.length;k++)ds[k].classList.toggle("sel",k===i);
  var m=metodos[i],contra=m.tipo==="contraentrega";
  $("pago-datos").style.display=contra?"none":"";
  $("paso-1").innerHTML=contra?esc(D.pagos.contraentregaDetalle||"Paga el total exacto cuando recibas tu pedido"):'Transfiere a <strong>'+esc(numeroBonito(D.pagos.numeroTransferencia))+'</strong> el total exacto por <strong>'+esc(m.nombre)+'</strong>';
  $("paso-3").innerHTML=contra?"<strong>Completa tus datos de envío</strong> en el chat y envía":"<strong>Adjunta la captura</strong> del pago en el chat y envía";
}
function pagar(){
  if(!carrito.length){alert("Tu carrito está vacío");return}
  $("modal-total-monto").textContent=fmt(totalCarrito());
  $("modal-pago").classList.add("activo");cerrarCarrito();
}
function cerrarModal(){$("modal-pago").classList.remove("activo")}
function modalClickFuera(e){if(e.target===$("modal-pago"))cerrarModal()}
function copiarNumero(){
  var btn=document.querySelector(".btn-copiar"),num=String(D.pagos.numeroTransferencia||"").replace(/\D/g,"");
  var listo=function(){btn.textContent="✔ ¡Copiado!";setTimeout(function(){btn.textContent="📋 Copiar número"},2000)};
  if(navigator.clipboard)navigator.clipboard.writeText(num).then(listo).catch(function(){alert("Número: "+num)});else alert("Número: "+num);
}
function prepararWsp(el){
  if(!carrito.length){alert("Tu carrito está vacío");return false}
  if(!D.whatsapp){alert("Esta tienda aún no tiene número de WhatsApp configurado");return false}
  var m=metodos[metodoSel]||{nombre:"",tipo:""};
  var pedidoId="P"+Date.now().toString(36).toUpperCase();
  var msg="*Pedido "+D.nombre+"*\n*N° de pedido:* "+pedidoId+"\n\n*Artículos:*\n";
  carrito.forEach(function(c){
    var p=porId(c.id),et=p.opciones?p.opciones.etiqueta:"";
    msg+="- "+c.cantidad+" x "+p.nombre+(c.opcion?" ("+et+": "+c.opcion+")":"")+" — "+fmt(p.precio*c.cantidad)+"\n";
  });
  msg+="\n*TOTAL:* "+fmt(totalCarrito())+" COP\n*Método de pago:* "+m.nombre+"\n\n";
  if(m.tipo!=="contraentrega")msg+="📸 *Adjunto el soporte del pago*\n\n";
  msg+="*Datos de envío:*\n\nNombres:\nDocumento:\nTeléfono:\nDirección completa:\nBarrio:\nCiudad:\nDepartamento:";
  el.href="https://wa.me/"+D.whatsapp+"?text="+encodeURIComponent(msg);
  if(BACKEND){
    // Registra el pedido en Google Sheets (descuenta stock) sin frenar la apertura de WhatsApp
    try{fetch(BACKEND,{method:"POST",mode:"no-cors",keepalive:true,headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({pedidoId:pedidoId,metodo:m.nombre,items:carrito.map(function(c){return{id:c.id,opcion:c.opcion,cantidad:c.cantidad}})})})}catch(e){}
  }
  setTimeout(function(){cerrarModal();vaciarCarrito()},300);return true;
}

/* ===== TOP ===== */
function mostrarTop(){
  var t=$("top");if(!t)return;t.innerHTML="";
  productos.slice().sort(function(a,b){return b.elo-a.elo}).slice(0,3).forEach(function(p,i){
    var d=document.createElement("div");d.className="top-card";
    d.innerHTML='<div class="top-rank">#'+(i+1)+'</div><img src="'+esc(p.imagen)+'" alt="'+esc(p.nombre)+'" loading="lazy"><h4>'+esc(p.nombre)+'</h4>';
    d.onclick=function(){verProducto(p.id)};t.appendChild(d);
  });
}

/* ===== RECOMENDADOS ===== */
function mostrarRecomendados(){
  var r=$("recomendados");if(!r)return;r.innerHTML="";
  var dest=productos.filter(function(p){return p.destacado});
  var resto=productos.filter(function(p){return !p.destacado}).sort(function(){return 0.5-Math.random()});
  dest.concat(resto).slice(0,4).forEach(function(p){
    var d=document.createElement("div");d.className="rec-card";
    d.innerHTML='<img src="'+esc(p.imagen)+'" alt="'+esc(p.nombre)+'" loading="lazy"><h4>'+esc(p.nombre)+'</h4><div class="rec-precio">'+fmt(p.precio)+'</div>';
    d.onclick=function(){verProducto(p.id)};r.appendChild(d);
  });
}

/* ===== DUELO (ELO) ===== */
function duelo(){
  var d=$("duelo");if(!d||productos.length<2)return;d.innerHTML="";
  var a=productos[Math.floor(Math.random()*productos.length)],b=a;
  while(b.id===a.id)b=productos[Math.floor(Math.random()*productos.length)];
  [a,b].forEach(function(p,idx){
    var div=document.createElement("div");div.className="duelo-card";
    div.innerHTML='<img src="'+esc(p.imagen)+'" alt="'+esc(p.nombre)+'" loading="lazy"><div class="duelo-nombre">'+esc(p.nombre)+'</div><div class="duelo-precio">'+fmt(p.precio)+'</div>';
    div.onclick=function(){
      var otro=idx===0?b:a;
      var esperado=1/(1+Math.pow(10,(otro.elo-p.elo)/400));
      var k=32*(1-esperado);
      p.elo+=k;otro.elo-=k;
      elos[p.id]=p.elo;elos[otro.id]=otro.elo;escribir("elo",elos);
      mostrarTop();duelo();
    };
    d.appendChild(div);
    if(idx===0){var vs=document.createElement("div");vs.className="duelo-vs";vs.textContent="VS";d.appendChild(vs)}
  });
}

/* ===== ASISTENTE DE LA TIENDA =====
   Chat automático: reconoce la intención de la pregunta y responde con los datos
   de esta tienda (productos, precios, pagos, envíos, horarios). No usa IA externa. */
var AS=D.asistente||{activo:false};
var N=D.negocio||{};
var CHIPS_INICIO=["Ver productos","Medios de pago","Envíos","¿Cómo compro?","Hablar con un asesor"];
var chatAbierto=false,chatIniciado=false;

function normalizar(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function contiene(t,palabras){for(var i=0;i<palabras.length;i++){if(t.indexOf(palabras[i])>=0)return true}return false}
function categorias(){var c=[];productos.forEach(function(p){if(c.indexOf(p.categoria)<0)c.push(p.categoria)});return c}
function lineaProducto(p){return "• "+esc(p.nombre)+" — "+fmt(p.precio)}
function enlaceWsp(texto){
  if(!D.whatsapp)return "contáctanos";
  return '<a href="https://wa.me/'+D.whatsapp+'?text='+encodeURIComponent("Hola "+D.nombre+", tengo una pregunta")+'" target="_blank" rel="noopener">'+texto+'</a>';
}
function saludoAsistente(){
  return AS.saludo?esc(AS.saludo):"¡Hola! 👋 Soy <strong>"+esc(AS.nombre)+"</strong>, tu asistente en <strong>"+esc(D.nombre)+"</strong>. Te ayudo a encontrar productos, precios, medios de pago y envíos. ¿Qué buscas hoy?";
}
function productoEnTexto(t){
  var exacto=null;
  productos.forEach(function(p){if(normalizar(p.nombre)===t)exacto=p});
  if(exacto)return exacto;
  var palabras=t.split(/[^a-z0-9ñ]+/).filter(function(w){return w.length>=3});
  var mejor=null,puntos=0;
  productos.forEach(function(p){
    var nombre=normalizar(p.nombre),cat=normalizar(p.categoria),n=0;
    palabras.forEach(function(w){if(nombre.indexOf(w)>=0)n+=2;else if(cat.indexOf(w)>=0)n+=1});
    if(n>puntos){puntos=n;mejor=p}
  });
  return puntos>=3?mejor:null;
}
function categoriaEnTexto(t){
  var cs=categorias();
  for(var i=0;i<cs.length;i++){
    var raiz=normalizar(cs[i]).replace(/(es|s)$/,"");
    if(raiz.length>=3&&t.indexOf(raiz)>=0)return cs[i];
  }
  return null;
}
function fichaProducto(p){
  var s='<div class="as-prod"><img src="'+esc(p.imagen)+'" alt=""><div><strong>'+esc(p.nombre)+'</strong><span>'+fmt(p.precio)+'</span>';
  if(p.opciones&&p.opciones.valores&&p.opciones.valores.length)s+='<small>'+esc(p.opciones.etiqueta)+': '+esc(p.opciones.valores.join(", "))+'</small>';
  if(p.stock!=null)s+='<small>'+(p.stock>0?"Disponibles: "+p.stock:"Agotado por ahora")+'</small>';
  return s+'<button data-ver="'+esc(p.id)+'">Ver en la tienda</button></div></div>';
}
function responder(texto){
  var t=normalizar(texto);
  if(contiene(t,["gracias","chao","adios","hasta luego","bye"]))
    return{html:"¡Con gusto! 😊 Si necesitas algo más, aquí estoy.",chips:[]};
  if(contiene(t,["asesor","humano","persona","alguien","hablar con","atencion","servicio al cliente","whatsapp","contact","llamar","telefono","celular","numero"]))
    return{html:"¡Claro! Un asesor te atiende personalmente: "+enlaceWsp("escríbenos por WhatsApp")+" 💬",chips:[]};
  if(contiene(t,["pago","pagar","nequi","daviplata","bre-b","breb","transfer","contraentrega","efectivo","tarjeta"])){
    var contra=metodos.some(function(m){return m.tipo==="contraentrega"});
    return{html:"Puedes pagar con: <strong>"+esc(metodos.map(function(m){return m.nombre}).join(", "))+"</strong>."+
      (contra?" También tenemos <strong>contraentrega</strong>: pagas cuando recibes tu pedido.":"")+
      " Al confirmar tu pedido te mostramos los datos para pagar.",chips:["¿Cómo compro?","Envíos"]};
  }
  if(contiene(t,["envio","envian","domicilio","entrega","llega","despacho","donde estan","ubicad","ciudad"]))
    return{html:(N.cobertura?esc(N.cobertura)+".":"Hacemos envíos.")+(N.ciudad?" Estamos en <strong>"+esc(N.ciudad)+"</strong>.":"")+
      " Para tiempos y costos exactos, "+enlaceWsp("escríbenos por WhatsApp")+".",chips:["Medios de pago","¿Cómo compro?"]};
  if(contiene(t,["horario","abren","cierran","atienden","abierto","que hora"]))
    return{html:N.horarios&&N.horarios.length?"Nuestros horarios:<br>"+N.horarios.map(esc).join("<br>"):"Para conocer nuestros horarios, "+enlaceWsp("escríbenos por WhatsApp")+".",chips:[]};
  if(contiene(t,["comprar","compro","pedido","pedir","ordenar","carrito","como hago"]))
    return{html:"¡Es muy fácil! 🛒<br>1. Elige tu producto y toca <strong>"+esc(D.botonAgregar)+"</strong>.<br>2. Abre el carrito (arriba a la derecha) y toca <strong>pagar</strong>.<br>3. Elige el medio de pago y confirma: tu pedido nos llega por <strong>WhatsApp</strong>.",chips:["Ver productos","Medios de pago"]};
  var p=productoEnTexto(t);
  if(p)return{html:"Esto encontré:"+fichaProducto(p),chips:["¿Cómo compro?","Ver productos"]};
  var cat=categoriaEnTexto(t);
  if(cat){
    var l=productos.filter(function(x){return x.categoria===cat});
    return{html:"En <strong>"+esc(cat)+"</strong> tenemos "+l.length+" producto"+(l.length!==1?"s":"")+":<br>"+l.slice(0,6).map(lineaProducto).join("<br>"),chips:l.slice(0,3).map(function(x){return x.nombre})};
  }
  if(contiene(t,["barato","economico","menor precio","mas bajo"])){
    var b=productos.slice().sort(function(a,c){return a.precio-c.precio}).slice(0,3);
    return{html:"Los más económicos:<br>"+b.map(lineaProducto).join("<br>"),chips:b.map(function(x){return x.nombre})};
  }
  if(contiene(t,["recomienda","recomendado","popular","mas vendido","favorito","mejor"])){
    var r=productos.slice().sort(function(a,c){return(c.destacado?1:0)-(a.destacado?1:0)||c.elo-a.elo}).slice(0,3);
    return{html:"Te recomiendo:<br>"+r.map(lineaProducto).join("<br>"),chips:r.map(function(x){return x.nombre})};
  }
  if(contiene(t,["producto","catalogo","venden","tienen","ofrecen","que hay","precio","cuanto","vale","cuesta"]))
    return{html:"Tenemos <strong>"+productos.length+" productos</strong> en: "+esc(categorias().join(", "))+". ¿Cuál te interesa? También puedes escribirme el nombre de un producto para ver su precio.",chips:categorias().slice(0,5)};
  if(contiene(t,["hola","buenas","buenos","hey","saludos","que tal"]))
    return{html:saludoAsistente(),chips:CHIPS_INICIO};
  return{html:"Mmm, no estoy seguro de entenderte 🤔. Puedo ayudarte con productos, precios, pagos, envíos y cómo comprar. Si prefieres, "+enlaceWsp("habla con un asesor por WhatsApp")+".",chips:CHIPS_INICIO};
}
function mensajeAsistente(html,quien){
  var c=$("as-mensajes"),d=document.createElement("div");
  d.className="as-msg as-"+quien;d.innerHTML=html;c.appendChild(d);c.scrollTop=c.scrollHeight;
  var bs=d.querySelectorAll("[data-ver]");
  for(var i=0;i<bs.length;i++){(function(b){b.onclick=function(){abrirAsistente(false);verProducto(b.getAttribute("data-ver"))}})(bs[i])}
}
function chipsAsistente(lista){
  var c=$("as-chips");c.innerHTML="";
  lista.forEach(function(x){var b=document.createElement("button");b.type="button";b.textContent=x;b.onclick=function(){preguntar(x)};c.appendChild(b)});
}
function preguntar(texto){
  texto=String(texto||"").trim();if(!texto)return;
  mensajeAsistente(esc(texto),"yo");chipsAsistente([]);
  var c=$("as-mensajes"),escribiendo=document.createElement("div");
  escribiendo.className="as-msg as-bot as-escribiendo";escribiendo.innerHTML="<i></i><i></i><i></i>";
  c.appendChild(escribiendo);c.scrollTop=c.scrollHeight;
  setTimeout(function(){escribiendo.remove();var r=responder(texto);mensajeAsistente(r.html,"bot");chipsAsistente(r.chips)},650);
}
function abrirAsistente(abrir){
  chatAbierto=abrir===undefined?!chatAbierto:abrir;
  $("as-panel").classList.toggle("abierto",chatAbierto);
  $("as-burbuja").classList.toggle("activa",chatAbierto);
  if(!chatAbierto)return;
  $("as-aviso").style.display="none";
  if(!chatIniciado){chatIniciado=true;mensajeAsistente(saludoAsistente(),"bot");chipsAsistente(CHIPS_INICIO)}
  setTimeout(function(){$("as-input").focus()},250);
}
function iniciarAsistente(){
  if(!AS.activo||!$("as-burbuja"))return;
  $("as-burbuja").onclick=function(){abrirAsistente()};
  $("as-cerrar").onclick=function(){abrirAsistente(false)};
  $("as-form").onsubmit=function(e){e.preventDefault();var i=$("as-input");preguntar(i.value);i.value=""};
  setTimeout(function(){if(!chatIniciado)$("as-aviso").style.display="block"},4000);
}

/* ===== VISOR DE FOTOS ===== */
function abrirVisor(p){
  var v=$("visor");if(!v)return;
  $("visor-img").src=p.imagen;$("visor-img").alt=p.nombre;
  $("visor-nombre").textContent=p.nombre;$("visor-precio").textContent=fmt(p.precio);
  $("visor-foto").classList.remove("ampliada");
  v.classList.add("activo");
}
function cerrarVisor(){var v=$("visor");if(v)v.classList.remove("activo")}
(function(){
  var v=$("visor");if(!v)return;
  var foto=$("visor-foto"),im=$("visor-img");
  v.addEventListener("click",function(e){if(e.target===v||e.target.closest(".visor-cerrar"))cerrarVisor()});
  foto.addEventListener("click",function(e){
    var r=foto.getBoundingClientRect();
    im.style.transformOrigin=((e.clientX-r.left)/r.width*100)+"% "+((e.clientY-r.top)/r.height*100)+"%";
    foto.classList.toggle("ampliada");
  });
  foto.addEventListener("mousemove",function(e){
    if(!foto.classList.contains("ampliada"))return;
    var r=foto.getBoundingClientRect();
    im.style.transformOrigin=((e.clientX-r.left)/r.width*100)+"% "+((e.clientY-r.top)/r.height*100)+"%";
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")cerrarVisor()});
})();

window.toggleCarrito=toggleCarrito;window.cerrarCarrito=cerrarCarrito;window.vaciarCarrito=vaciarCarrito;
window.pagar=pagar;window.cerrarModal=cerrarModal;window.modalClickFuera=modalClickFuera;
window.copiarNumero=copiarNumero;window.prepararWsp=prepararWsp;window.filtrarBusqueda=aplicarFiltros;

/* ===== BACKEND (Google Sheets) ===== */
// Si la tienda tiene backend, los productos, precios y stock salen de la hoja.
// Si la hoja no responde, la tienda sigue funcionando con los datos de este archivo.
function cargarBackend(listo){
  if(!BACKEND||!window.fetch){listo();return}
  var terminado=false;
  var fin=function(){if(!terminado){terminado=true;listo()}};
  setTimeout(fin,6000);
  fetch(BACKEND).then(function(r){return r.json()}).then(function(d){
    if(terminado||!d||!d.ok||!d.productos||!d.productos.length)return;
    productos=d.productos.map(function(p){
      var local=porId(p.id);
      // Las fotos locales (img/...) se toman de este archivo; las URL completas, de la hoja
      if(!/^https?:/.test(p.imagen||"")&&local)p.imagen=local.imagen;
      return p;
    });
  }).catch(function(){}).then(fin);
}

/* ===== INICIO ===== */
function iniciar(){
  carrito=leer("carrito",[]).filter(function(c){return porId(c.id)});
  // Un carrito guardado de otra visita no puede superar el stock actual
  productos.forEach(function(p){
    if(p.stock==null)return;
    var resta=p.stock;
    carrito.forEach(function(c){if(c.id===p.id){c.cantidad=Math.min(c.cantidad,resta);resta-=c.cantidad}});
  });
  carrito=carrito.filter(function(c){return c.cantidad>0});
  productos.forEach(function(p){p.elo=typeof elos[p.id]==="number"?elos[p.id]:1000});
  crearFiltros();mostrarProductos(productos);mostrarTop();mostrarRecomendados();duelo();
  crearMetodos();actualizarCarrito();iniciarAsistente();
}
cargarBackend(iniciar);
})();
`;
