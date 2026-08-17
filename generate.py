import json,os
from http.server import BaseHTTPRequestHandler
from openai import OpenAI

SCHEMA={"type":"object","additionalProperties":False,"properties":{"slides":{"type":"array","items":{"type":"object","additionalProperties":False,"properties":{"title":{"type":"string"},"bullets":{"type":"array","items":{"type":"string"}},"speaker_notes":{"type":"string"},"image_prompt":{"type":"string"}},"required":["title","bullets","speaker_notes","image_prompt"]}}},"required":["slides"]}

def send(h,status,data):
 b=json.dumps(data).encode(); h.send_response(status); h.send_header("Content-Type","application/json"); h.send_header("Access-Control-Allow-Origin","*"); h.send_header("Access-Control-Allow-Headers","Content-Type"); h.send_header("Access-Control-Allow-Methods","POST, OPTIONS"); h.end_headers(); h.wfile.write(b)

class handler(BaseHTTPRequestHandler):
 def do_OPTIONS(self): send(self,200,{"ok":True})
 def do_POST(self):
  try:
   n=int(self.headers.get("Content-Length","0")); d=json.loads(self.rfile.read(n) or b"{}")
   topic=str(d.get("topic","")).strip(); count=int(d.get("slides",10)); style=d.get("style","Professional"); audience=d.get("audience","Students"); language=d.get("language","English")
   if not topic:return send(self,400,{"error":"Topic is required."})
   if not 3<=count<=40:return send(self,400,{"error":"Slides must be between 3 and 40."})
   key=os.getenv("OPENAI_API_KEY")
   if not key:return send(self,500,{"error":"OPENAI_API_KEY is not configured on the server."})
   client=OpenAI(api_key=key)
   prompt=f"""Create a polished PowerPoint presentation.
Topic: {topic}
Number of slides: exactly {count}
Style: {style}
Audience: {audience}
Language: {language}
Create exactly {count} slides. First slide should introduce the topic and final slide should summarize key takeaways. Use 3-6 concise bullets per slide. Keep information accurate and appropriate for the audience. For every slide include a useful image_prompt and concise speaker_notes. Do not invent citations."""
   r=client.responses.create(model=os.getenv("OPENAI_MODEL","gpt-5.6"),input=prompt,text={"format":{"type":"json_schema","name":"presentation_deck","strict":True,"schema":SCHEMA}})
   return send(self,200,json.loads(r.output_text))
  except Exception as e:return send(self,500,{"error":str(e)})
