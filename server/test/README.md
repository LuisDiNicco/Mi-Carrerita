# Protocolo de Testing

## Para cada bug reportado
1. Escribir PRIMERO un test que reproduzca el bug (debe fallar).
2. Corregir la implementación.
3. El test debe pasar.
4. Commit: `fix(scope): description` + `test(scope): regression test for #issue`.

## Para cada feature nueva
1. Escribir tests desde los requisitos (docs/), NO leyendo el código.
2. Nomenclatura: describe('Service') > it('should [verbo] when [condición]')
