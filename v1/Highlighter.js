class Highlighter{
    constructor(){
        this.highlightClassName = 'highhighlightlight';
        this.highlightCss = document.createElement('style');
        this.highlightCss.innerHTML = `
            .${this.highlightClassName} {
                border: 1px solid red;
            }
        `;
        document.head.appendChild(this.highlightCss);
    }
    highlightElement(element){
      element.classList.add(this.highlightClassName);
    }
    unhighlightElement(element){
      element.classList.remove(this.highlightClassName);
    }
    unhighlightAll(){
      let highlightedElements = document.getElementsByClassName(this.highlightClassName);
      for(let highlightedElement of highlightedElements){
          this.unhighlightElement(highlightedElement);
      }
    }
}