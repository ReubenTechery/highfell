import sys
from html.parser import HTMLParser
void={'meta','link','br','img','input','hr','path','rect','circle','ellipse','stop','line','polygon','polyline'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in void: s.stack.append((t,s.getpos()))
    def handle_endtag(s,t):
        if t in void: return
        if not s.stack: s.err.append(('extra close',t,s.getpos())); return
        if s.stack[-1][0]==t: s.stack.pop()
        else: s.err.append(('mismatch',t,s.stack[-1],s.getpos()))
for f in sys.argv[1:]:
    src=open(f,encoding='utf-8').read()
    body=src.split('<x-dc>')[1].split('</x-dc>')[0]
    p=P(); p.feed(body)
    ids=[x for x in __import__('re').findall(r' id="([^"]+)"',body)]
    dup={i for i in ids if ids.count(i)>1}
    print(f.split('/')[-1], 'unclosed:',p.stack[:3],'errors:',p.err[:3],'dup ids:',dup or 'none')
