const express = require('express');
const bodyParser = require('body-parser');

const { randomUUID } = require("crypto");
const { autenticar } = require('./service');


const server = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

server.use(express.static('public'));

server.listen(8080, () => "Servidor iniciado com sucesso");

const fs = require('fs');

server.get("/login", (request, response) => {

    return response.send("Olá mundo")
});

server.post("/login", (request, response) => {

    return response.send("Olá mundo")
});

server.get("/publicacoes", (request, response) => {
    const usuarios = require("./mocks/usuarios.json");
    const publicacoes = require("./mocks/publicacoes.json");

    const { idUsuarioLogado } = request.query;
    const usuarioLogado = usuarios.find(usuario => usuario.id == idUsuarioLogado);
    const usuariosInscritos = usuarioLogado.inscritos;

    let timeline = [];
    for (const idUsuarioInscrito of usuariosInscritos) {
        timeline = [...timeline, ...publicacoes.filter(publicacao => publicacao.idUsuario == idUsuarioInscrito)]
    }

    let html = "";
    const htmlPublicacoes = timeline.map(publicacao => {
        const detalhesUsuario = usuarios.find(usuario => usuario.id == publicacao.idUsuario);
        return `
            
            <h2>Timeline</h2>
            <div style="border-bottom: 1px solid black">
                <h3>${detalhesUsuario.nome}</h3>
                <p>${publicacao.texto}</p>
                <button>Gostei</button>
            </div>
        `;
    }).join("");

    const htmlNovaPublicacao = ` <form method="post" action="/publicacoes">
                <textarea name="texto"></textarea>
                <input name="idUsuario" type="hidden" value="${idUsuarioLogado}"/>
                <button>Publicar</button>
            </form>

            <br>
            <br>
            <br>`

    html = htmlNovaPublicacao + htmlPublicacoes;

    return response.send(html)
});

server.post("/publicacoes", urlencodedParser, (request, response) => {
    const json = require("./mocks/publicacoes.json");

    const {
        idUsuario,
        texto
    } = request.body;

    const novaPublicacao = {
        idUsuario: Number(idUsuario),
        texto,
        idUsuariosGostei: []
    }

    json.push(novaPublicacao);

    fs.writeFileSync("./mocks/publicacoes.json", JSON.stringify(json, null, 2));

    return response.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <p>Publicação realizada com sucesso</p>
        </body>
        </html>
    `);
});

server.put("/publicacoes/:id/gostei", (request, response) => {
    const { id } = request.params;
    return response.send("Olá mundo")
});

server.put("/publicacoes/:id/comentario", (request, response) => {
    const { id } = request.params;
    return response.send("Olá mundo")
});









