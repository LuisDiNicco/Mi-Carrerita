const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
    console.log("Starting test-parser.js");
    const buffer = fs.readFileSync('c:\\Users\\luisd\\Desktop\\Proyectos\\Mi-Carrerita\\43664669_historia_academica.pdf');
    try {
        const data = await pdfParse(buffer);
        console.log("PDF TEXT:\n");
        console.log(data.text);
    } catch (e) {
        console.error("Error occurred:", e.message);
        console.error(e.stack);
    }
}

test();
