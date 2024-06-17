import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const host = '0.0.0.0';
const porta = 3000;

const app = express();

var listaInt = [];
var listaAnimais = [];
var listaAdocao = [];
const validUsers = [{ email: "teste@exemplo.com", senha: "123456" }];

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'seu-segredo',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login.html');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const user = validUsers.find(user => user.email === email && user.senha === senha);

    if (user) {
        req.session.user = email;
        const lastAccess = new Date().toString();
        res.cookie('lastAccess', lastAccess, { maxAge: 30 * 60 * 1000, httpOnly: false });
        res.status(200).json({ success: true, lastAccess });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/registrar', (req, res) => {
    const { nome, email, senha } = req.body;

    const userExists = validUsers.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ success: false, message: "Email já registrado" });
    }

    validUsers.push({ email, senha });
    res.status(200).json({ success: true });
});

app.post('/cadastrarInt', isAuthenticated, (req, res) => {
    const { nome, sobrenome, email, dataNascimento, cidade, estado, cep } = req.body;

    listaInt.push({
        nome: nome,
        sobrenome: sobrenome,
        email: email,
        dataNascimento: dataNascimento,
        cidade: cidade,
        estado: estado,
        cep: cep
    });

    res.json(listaInt);
});

app.get('/listarInt', isAuthenticated, (req, res) => {
    res.json(listaInt);
});

app.post('/cadastrarAnimal', isAuthenticated, (req, res) => {
    const { nome, idade, raca } = req.body;

    listaAnimais.push({
        nome: nome,
        idade: idade,
        raca: raca
    });

    res.json(listaAnimais);
});

app.get('/listarAnimais', isAuthenticated, (req, res) => {
    res.json(listaAnimais);
});

app.get('/adotarPet', isAuthenticated, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'adotarPet.html'));
});

app.get('/dadosAdocao', isAuthenticated, (req, res) => {
    res.json({
        interessados: listaInt,
        pets: listaAnimais
    });
});

app.post('/registrarAdocao', isAuthenticated, (req, res) => {
    const { interessado, pet } = req.body;
    const data = new Date().toString();

    listaAdocao.push({
        interessado: interessado,
        pet: pet,
        data: data
    });

    res.json({ success: true });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get('/index', isAuthenticated, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(porta, host, () => {
    console.log(`Servidor está executando em http://${host}:${porta}/index`);
});