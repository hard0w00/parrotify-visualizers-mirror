const VS=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
const FS=`
precision highp float;
uniform vec2 R;uniform float T,B,M,H,E,X;uniform vec3 C,A;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(float n){return fract(sin(n)*43758.5453);}
float oct(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735027;}
vec2 scene(vec3 p){
  vec3 q=p;q.xz=rot(T*.25)*q.xz;q.xy=rot(sin(T*.2)*.12)*q.xy;
  float core=oct(q,1.25+B*.12+X*.08);float d=core,id=1.;
  for(int i=0;i<10;i++){float fi=float(i),a=fi*.6283-T*(.25+fi*.006);vec3 s=p-vec3(cos(a)*(2.+B*.25),.45*sin(a*2.+T),sin(a)*(2.+B*.25));s.xz=rot(-a+T)*s.xz;s.xy=rot(a)*s.xy;float sd=oct(s,.16+hash(fi)*.18);if(sd<d){d=sd;id=2.;}}
  return vec2(d,id);
}
vec3 normal(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));}
vec3 env(vec3 r){float band=pow(.5+.5*sin(atan(r.z,r.x)*8.+r.y*12.-T*.3),16.);return vec3(.004,.006,.018)+mix(C,A,.5+.5*sin(r.y*9.))*band*(.12+H*.25)+vec3(.7,.85,1.)*pow(max(r.y,0.),24.)*.4;}
void main(){
 vec2 uv=(2.*gl_FragCoord.xy-R)/R.y;float a=.4+T*.07;vec3 ro=vec3(cos(a)*5.6,1.8+sin(T*.17)*.4,sin(a)*5.6);vec3 fw=normalize(-ro),rt=normalize(cross(vec3(0.,1.,0.),fw)),up=cross(fw,rt);vec3 rd=normalize(fw*1.8+rt*uv.x+up*uv.y);
 float d=0.,id=0.,aura=0.;for(int i=0;i<70;i++){vec2 s=scene(ro+rd*d);aura+=exp(-8.*max(s.x,0.))*.009;if(s.x<.002||d>24.)break;d+=s.x*.82;}
 vec3 col=env(rd);if(d<24.){vec3 p=ro+rd*d,n=normal(p),v=-rd;float fr=pow(1.-max(dot(n,v),0.),2.);vec3 tint=id<1.5?mix(C,A,.28+.2*sin(p.y*4.)):A;col=tint*(.08+fr*.9)+env(reflect(rd,n))*1.7;col+=vec3(1.)*pow(max(dot(reflect(-normalize(vec3(-.4,.8,.3)),n),v),0.),80.)*2.;col+=tint*X*.45;}
 col+=mix(C,A,.45)*aura*(.5+E+X);float ring=exp(-abs(length(uv)-1.1-X*.08)*90.);col+=C*ring*X*.25;col=col/(col+vec3(.7));col*=1.-.25*dot(uv*.5,uv*.5);gl_FragColor=vec4(pow(col,vec3(.4545)),1.);
}`
let g,p,b,u,last=0,pulse=0,beats=-1
function shader(t,s){const x=g.createShader(t);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(x));return x}const rgb=(s,d)=>String(s||d).split(',').map(v=>Math.min(1,Math.max(0,Number(v)/255||0)))
parrotify.register({webgl:true,maxPixelRatio:.8,color:'#9de8ff',init(c){g=c;p=g.createProgram();g.attachShader(p,shader(g.VERTEX_SHADER,VS));g.attachShader(p,shader(g.FRAGMENT_SHADER,FS));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));b=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),g.STATIC_DRAW);u={};for(const n of ['R','T','B','M','H','E','X','C','A'])u[n]=g.getUniformLocation(p,n)},draw(_,f){let dt=Math.min(.1,Math.max(0,f.time-(last||f.time)));last=f.time;if((f.beats||0)!==beats){beats=f.beats||0;pulse=1}pulse*=Math.exp(-dt*5);g.disable(g.DEPTH_TEST);g.useProgram(p);g.bindBuffer(g.ARRAY_BUFFER,b);let a=g.getAttribLocation(p,'p');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);g.uniform2f(u.R,f.pw,f.ph);g.uniform1f(u.T,f.time%1000);g.uniform1f(u.B,f.bass);g.uniform1f(u.M,f.mid);g.uniform1f(u.H,f.high);g.uniform1f(u.E,f.energy);g.uniform1f(u.X,f.playing?pulse:0);g.uniform3fv(u.C,rgb(f.rgb,'157,232,255'));g.uniform3fv(u.A,rgb(f.accentRgb,'217,100,255'));g.drawArrays(g.TRIANGLES,0,3)}})
