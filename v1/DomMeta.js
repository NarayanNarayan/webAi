class Node {
    path;
    tag;
    constructor() {

    }
}

class ContainerNode extends Node {
    childs = [];
}

class TextNode extends Node {
    txt;
}

class InputNode extends Node {
    html;
    value;
}