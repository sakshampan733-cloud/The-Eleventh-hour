import zlib,struct
d=open('field.png','rb').read()
i=d.index(b'IHDR'); W,H=struct.unpack('>II',d[i+4:i+12])
idat=b''; p=8
while p<len(d):
    ln=struct.unpack('>I',d[p:p+4])[0]; tag=d[p+4:p+8]
    if tag==b'IDAT': idat+=d[p+8:p+8+ln]
    p+=12+ln
raw=zlib.decompress(idat); stride=W*3+1
dark=lit=tot=0; s=0.0
for y in range(0,H,3):
    row=raw[y*stride+1:(y+1)*stride]
    for x in range(0,W*3,9):
        r,g,b=row[x],row[x+1],row[x+2]
        L=(0.2126*r+0.7152*g+0.0722*b)/255
        s+=L; tot+=1
        if L<0.10: dark+=1
        if L>0.50: lit+=1
print("%2.0f%% black · %4.1f%% lit · mean %.3f" % (100*dark/tot, 100*lit/tot, s/tot))
