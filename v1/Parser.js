
function domToJson(element, path = 'body') {
    // Check if the input is a valid DOM element
    if (!(element instanceof Element)) {
      return null;
    }
    // Initialize the JSON object for the current element
    const json = {
      path: path,
      tag: element.tagName.toLowerCase(),
      text: "",
      childs: []
    };
  
    // Collect text content from text nodes TODO: 
    const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
    json.text = textNodes.map(node => node.textContent.trim()).join("\n").trim();
  
    // Recursively process child elements
    const childElements = Array.from(element.children);
    let i=0;
    for (const child of childElements) {
      i++;
      if(child.tagName.toLowerCase() == 'script') continue;
      const childJson = domToJson(child, path + `> *:nth-child(${i})`);
      if (childJson) {
        childJson.i = i;
        json.childs.push(childJson);
      }
    }
    if(json.tag === 'input'){
      delete json.text;
      json.html = element.outerHTML;
      json.value = element.value;
    }
    if(json.text === "" && json.childs.length === 0){
      return null;
    }
    return json;
}

function overrideJsonValues(src, dst) {
    for (const key in src) {
        dst[key] = src[key];
    }
    return dst;
}

class DomBridge{
  constructor(){
    this._bodyJson = null;
    this._miniBodyJson = null;
    this._flatContent = null;
    this.highlights = [];
    this._idPathMap = {};
  }
  get bodyJson(){
    this._parse();
    return JSON.stringify(this._bodyJson);
  }
  get miniBodyJson(){
    this._parse()._shorten();
    console.log(this._miniBodyJson);
    return JSON.stringify(this._miniBodyJson);
  }
  _parse(){
    this._bodyJson = domToJson(document.body);
    return this;
  }
  _shorten(){
    if(!this._bodyJson){
        this._parse();
    }
    this._idPathMap = {};
    this._miniBodyJson = structuredClone(this._bodyJson);
    let stack = [this._miniBodyJson];
    while(stack.length > 0){
      let json = stack.pop();
      while(json.text === "" && json.childs.length === 1){
        overrideJsonValues(json.childs[0], json);
      }
      json.id = crypto.randomUUID().substring(0,8);
      this._idPathMap[json.id] = json.path;
      delete json.path;
      delete json.i;

      stack.push(...json.childs);
    }
    return this;
  }
  _flatten(){
    if(!this._miniBodyJson){
        this._parse()._shorten();
    }
    let stack = [this._miniBodyJson];
    this._flatContent = [];
    while(stack.length > 0){
        let json = stack.pop();
      if(json.text !== ""){     
        this._flatContent.push(json.text);
      }
      stack.push(...json.childs);
    }
    return this;
  }
  update(){
    return this._parse()._shorten()._flatten();
  }
  getElementByPath(path){
    return document.querySelector(path);
  }
  getElementById(id){
    return document.querySelector(this._idPathMap[id]);
  }
}
let db = new DomBridge();