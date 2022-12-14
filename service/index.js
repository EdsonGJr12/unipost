
const fs = require('fs');
const path = require("path");


function autenticar(login, senha) {
    const usuarios = require("../mocks/usuarios.json");
    const usuario = usuarios.find(usuario => usuario.login == login);
    if (!usuario) {
        return false;
    } else {
        if (usuario.senha != senha) {
            return false;
        }
    }

    const usuariosAtualizados = usuarios.map(usuario => {
        if (usuario.login == login) {
            return {
                ...usuario,
                logado: true
            }
        } else {
            return usuario;
        }
    });

    const filePath = path.resolve(__dirname, "../mocks/usuarios.json")
    fs.writeFileSync(filePath, JSON.stringify(usuariosAtualizados, null, 2));

    return usuario;
}

function salvarNovaPublicacao(novaPublicacao) {
    const json = require("../mocks/publicacoes.json");
    json.push(novaPublicacao);
    const filePath = path.resolve(__dirname, "../mocks/publicacoes.json")
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
}

function gerarIdPublicacao() {
    const publicacoes = require("../mocks/publicacoes.json");
    let ultimoIdGerado = publicacoes[publicacoes.length - 1].id;
    return ultimoIdGerado += 1;
}

function salvarPublicacao(publicacao) {
    const json = require("../mocks/publicacoesSalvas.json")
    json.push(publicacao)
    const filePath = path.resolve(__dirname, "../mocks/publicacoesSalvas.json")
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
}

function desalvarPublicacao(publicacao){
    const json = require("../mocks/publicacoesSalvas.json")
    json.splice(publicacao.id, 1)
}


module.exports = {
    autenticar,
    salvarNovaPublicacao,
    gerarIdPublicacao,
    salvarPublicacao,
    desalvarPublicacao
}
