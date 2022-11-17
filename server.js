const express = require('express');
const bodyParser = require('body-parser');

const { autenticar, salvarNovaPublicacao, gerarIdPublicacao, salvarPublicacao, desalvarPublicacao} = require('./service');

const server = express();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

server.use(express.static('public'));

server.listen(process.env.PORT || 8080, () => "Servidor iniciado com sucesso");

const fs = require('fs');

server.get("/login", (request, response) => {

    return response.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <form action="/login" method="post">
                <h1>Login</h1>
                <input type="text" name="login">
                <input type="password" name="senha">
                <button type="submit">Logar</button>
            </form>
        </body>
        </html>
    `);
});

server.post("/login", urlencodedParser, (request, response) => {
    const {
        login,
        senha
    } = request.body;

    const autenticado = autenticar(login, senha);
    if (autenticado) {
        return response.redirect(`/publicacoes?idUsuario=${autenticado.id}`);
    }

    return response.send("Usuário ou senha inválidos")
});

server.post("/logout", urlencodedParser, (request, response) => {
    const usuarios = require("./mocks/usuarios.json");

    const {
        idUsuario,
    } = request.body;


    let usuarioAtualizado = usuarios.find(usuario => usuario.id == idUsuario)
    usuarioAtualizado.logado = false;

    const usuariosAtualizados = usuarios.map(usuario => {
        if (usuario.id == idUsuario) {
            return usuarioAtualizado
        } else {
            return usuario;
        }
    })

    fs.writeFileSync("./mocks/usuarios.json", JSON.stringify(usuariosAtualizados, null, 2));

    return response.redirect("/login");
});

server.get("/publicacoes", (request, response) => {
    const usuarios = require("./mocks/usuarios.json");
    const publicacoes = require("./mocks/publicacoes.json");

    const { idUsuario } = request.query;
    const usuarioLogado = usuarios.find(usuario => usuario.id == idUsuario);

    if (!usuarioLogado || !usuarioLogado.logado) {
        return response.redirect("/login")
    }

    const htmlLogout = `
        <form method="post" action="/logout">
            <input name="idUsuario" type="hidden" value="${idUsuario}"/>
            <button>Logout</button>
        </form>
    `;

    const htmlNovaPublicacao = htmlLogout + ` <form method="post" action="/publicacoes">
                                    <textarea name="texto"></textarea>
                                    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
                                    <button>Publicar</button>
                                </form>

                                <br>
                                <br>
                                <br>`

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
                ${publicacao.idUsuariosGostei.includes(usuarioLogado.id) ? (
                `
                        <form method="post" action="/publicacoes/${publicacao.id}/gostei">
                            <button type="submit">Remover gostei</button>
                            <input name="idUsuario" type="hidden" value="${idUsuario}"/>
                        </form>
                    `
            ) : (
                `
                            <form method="post" action="/publicacoes/${publicacao.id}/gostei">
                                <button type="submit">Gostei</button>
                                <button id="save">Salvar</button>
                                <input name="idUsuario" type="hidden" value="${idUsuario}"/>
                            </form>
                    `
            )}

            </div>
        `;
    }).join("");

    html = htmlNovaPublicacao + htmlPublicacoes;

    return response.send(html)
});

server.post("/publicacoes", urlencodedParser, (request, response) => {

    const {
        idUsuario,
        texto
    } = request.body;

    const idPublicacao = gerarIdPublicacao();

    const novaPublicacao = {
        id: idPublicacao,
        idUsuario: Number(idUsuario),
        texto,
        idUsuariosGostei: [],
        publicacaoSalva
    }

    salvarNovaPublicacao(novaPublicacao);

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

server.post("/publicacoes/:id/gostei", urlencodedParser, (request, response) => {
    const { id } = request.params;
    let {
        idUsuario
    } = request.body;

    idUsuario = Number(idUsuario);

    const publicacoes = require("./mocks/publicacoes.json");

    let publicacao = publicacoes.find(publicacao => publicacao.id == id);

    if (publicacao.idUsuariosGostei.includes(idUsuario)) {
        let publicacao = publicacoes.find(publicacao => publicacao.id == id);
        publicacao.idUsuariosGostei = publicacao.idUsuariosGostei
            .filter(idUsuarioGostei => idUsuarioGostei != idUsuario);
    } else {
        publicacao.idUsuariosGostei.push(Number(idUsuario));
    }

    const publicacoesAtualizadas = publicacoes.map(pub => {
        if (pub.id == id) {
            return publicacao;
        } else {
            return pub;
        }
    });

    fs.writeFileSync("./mocks/publicacoes.json", JSON.stringify(publicacoesAtualizadas, null, 2));

    return response.redirect(`/publicacoes?idUsuario=${idUsuario}`);
});

server.post('/salvarPublicacao', (req, res) =>{
    const id = req.params
    let idUsuario = req.body
    idUsuario = Number(idUsuario)

    const publicacoes = require("./mocks/publicacoes.json")

    let pub = publicacoes.find(publicacao => publicacao.id == id)

    getElementById("save").onclick = function save(){
        pub.publicacaoSalva = true
        salvarPublicacao(pub)
        getElementById("save").innerHTML = "Desfazer"
    }
    return res.redirect(`/publicacoes?idUsuario=${idUsuario}`)

})

server.post('/desalvarPublicacao', (req, res) => {
    const id = req.params
    let idUsuario = req.body

    const publicacoesSalvas = require("./mocks/publicacoesSalvas.json")
    let publicacao = publicacoesSalvas.find(publicacao => publicacao.id == id)
    
    if (publicacao.publicacaoSalva == true){
        getElementById("save").onclick = function desalvar(){
            publicacao.publicacaoSalva == false
            desalvarPublicacao(publicacao)
            
        }
    }

    return res.redirect(`/publicacoes?idUsuario=${idUsuario}`)
})
//






