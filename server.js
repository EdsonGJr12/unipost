const express = require('express');
const bodyParser = require('body-parser');

const { autenticar, salvarNovaPublicacao, gerarIdPublicacao, salvarPublicacao, desalvarPublicacao } = require('./service');

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
        idUsuariosGostei: []
    }

    salvarNovaPublicacao(novaPublicacao);

    return response.end(`
        < !DOCTYPE html >
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

    const htmlPublicacoesSalvas = `
    <form method="get" action="/publicacoes-salvas">
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    <button>Publicações salvas</button>
    </form> 
    `;

    const htmlNomeUsuario = `
    <form method="get" action="/usuario-nome">
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    <button>Editar nome usuário</button>
    </form> 
    `;

    const htmlNovaPublicacao = htmlLogout + htmlPublicacoesSalvas + htmlNomeUsuario + ` <form method="post" action="/publicacoes">
    <textarea name="texto"></textarea>
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    <button>Publicar</button>
    </form>
    
    <h2>Timeline</h2>
    
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
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    </form>
    `
            )}
    
    ${usuarioLogado.idPublicacoesSalvas.includes(publicacao.id) ? (
                `
    <form method="post" action="/publicacoes/${publicacao.id}/salvar">
    <button type="submit">Desfazer</button>
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    </form>
    `
            ) : (
                `
    <form method="post" action="/publicacoes/${publicacao.id}/salvar">
    <button type="submit">Salvar</button>
    <input name="idUsuario" type="hidden" value="${idUsuario}"/>
    </form>
    `
            )}
    
    </div >
    `;
    }).join("");

    html = htmlNovaPublicacao + htmlPublicacoes;

    return response.send(html)
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

server.post("/publicacoes/:id/salvar", urlencodedParser, (req, res) => {
    const { id } = req.params;
    let { idUsuario } = req.body;
    idUsuario = Number(idUsuario)
    let publicacoes = require("./mocks/publicacoes.json");
    let usuarios = require("./mocks/usuarios.json");
    const publicacao = publicacoes.find(publicacao => publicacao.id == id);
    let usuarioLogado = usuarios.find(usuario => usuario.id == idUsuario);

    if (usuarioLogado.idPublicacoesSalvas.includes(Number(publicacao.id))) {
        const idPublicacoesSalvasAtualizado = usuarioLogado.idPublicacoesSalvas.filter(idPublicacoesSalvas => idPublicacoesSalvas != id)
        usuarioLogado.idPublicacoesSalvas = idPublicacoesSalvasAtualizado;
    } else {
        usuarioLogado.idPublicacoesSalvas.push(Number(id))
    }

    const usuariosAtualizados = usuarios.map(user => {
        if (user.id == usuarioLogado.id) {
            return usuarioLogado;
        } else {
            return user;
        }
    });


    fs.writeFileSync("./mocks/usuarios.json", JSON.stringify(usuariosAtualizados, null, 2));

    return res.redirect(`/publicacoes?idUsuario=${idUsuario}`)
})

server.get("/publicacoes-salvas", (request, response) => {
    const { idUsuario } = request.query;

    let publicacoes = require("./mocks/publicacoes.json");
    let usuarios = require("./mocks/usuarios.json");

    let usuarioLogado = usuarios.find(usuario => usuario.id == idUsuario);

    console.log(usuarioLogado)

    const html = usuarioLogado.idPublicacoesSalvas.map(idPublicacao => {
        const publicacao = publicacoes.find(publicacao => publicacao.id == idPublicacao);

        return `
            <div style="border-bottom: 1px solid black">
                <p>${publicacao.texto}</p>
            </div>
        `
    }).join("");

    return response.send(html);
});




server.get("/usuario-nome", (request, response) => {
    const { idUsuario } = request.query;

    let usuarios = require("./mocks/usuarios.json");

    let usuarioLogado = usuarios.find(usuario => usuario.id == idUsuario);

    const html = `<form action="/usuario-nome" method="post">
    <h1>Editar nome do usuário</h1>
    <input type="text" name="nome" value=${usuarioLogado.nome}> 
    <input type="hidden" name="idUsuario" value=${idUsuario}> 
    <button type="submit">Logar</button>
    </form>`;

    return response.send(html);
});

server.post("/usuario-nome", urlencodedParser, (request, response) => {

    let { idUsuario, nome } = request.body;

    let usuarios = require("./mocks/usuarios.json");

    let usuarioLogado = usuarios.find(usuario => usuario.id == idUsuario);

    usuarioLogado.nome = nome;

    const usuariosAtualizados = usuarios.map(user => {
        if (user.id == usuarioLogado.id) {
            return usuarioLogado;
        } else {
            return user;
        }
    });

    fs.writeFileSync("./mocks/usuarios.json", JSON.stringify(usuariosAtualizados, null, 2));

    return response.redirect(`/publicacoes?idUsuario=${idUsuario}`);
});








