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

var carrito=leer("carrito",[]).filter(function(c){return porId(c.id)});
var elos=leer("elo",{});
productos.forEach(function(p){p.elo=typeof elos[p.id]==="number"?elos[p.id]:1000});
var categoriaActiva="Todos";

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
    if(sel)sel.onchange=function(){sel.style.borderColor=""};
    btn.onclick=function(){
      var v=sel?sel.value:"";
      if(sel&&!v){sel.style.borderColor="#ff6666";sel.focus();return}
      agregarCarrito(p,v);animarVuelo(img);
      btn.classList.add("agregado");btn.textContent="✔ Agregado";
      setTimeout(function(){btn.classList.remove("agregado");btn.textContent=D.botonAgregar},1600);
    };
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
function cambiarCantidad(i,d){carrito[i].cantidad+=d;if(carrito[i].cantidad<=0)carrito.splice(i,1);guardar();actualizarCarrito()}
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
  var msg="*Pedido "+D.nombre+"*\n\n*Artículos:*\n";
  carrito.forEach(function(c){
    var p=porId(c.id),et=p.opciones?p.opciones.etiqueta:"";
    msg+="- "+c.cantidad+" x "+p.nombre+(c.opcion?" ("+et+": "+c.opcion+")":"")+" — "+fmt(p.precio*c.cantidad)+"\n";
  });
  msg+="\n*TOTAL:* "+fmt(totalCarrito())+" COP\n*Método de pago:* "+m.nombre+"\n\n";
  if(m.tipo!=="contraentrega")msg+="📸 *Adjunto el soporte del pago*\n\n";
  msg+="*Datos de envío:*\n\nNombres:\nDocumento:\nTeléfono:\nDirección completa:\nBarrio:\nCiudad:\nDepartamento:";
  el.href="https://wa.me/"+D.whatsapp+"?text="+encodeURIComponent(msg);
  setTimeout(cerrarModal,300);return true;
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

window.toggleCarrito=toggleCarrito;window.cerrarCarrito=cerrarCarrito;window.vaciarCarrito=vaciarCarrito;
window.pagar=pagar;window.cerrarModal=cerrarModal;window.modalClickFuera=modalClickFuera;
window.copiarNumero=copiarNumero;window.prepararWsp=prepararWsp;window.filtrarBusqueda=aplicarFiltros;

/* ===== INICIO ===== */
crearFiltros();mostrarProductos(productos);mostrarTop();mostrarRecomendados();duelo();
crearMetodos();actualizarCarrito();
})();
`;
