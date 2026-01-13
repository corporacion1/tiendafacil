# Script para corregir las dependencias del useEffect en useProducts.ts
$file = "c:\app\tiendafacil\src\hooks\useProducts.ts"

# Leer el contenido
$content = Get-Content $file -Raw

# Hacer el reemplazo - cambiar las dependencias del useEffect
$oldPattern = '  }, \[fetchProducts, storeId\]\);'
$newPattern = '    // eslint-disable-next-line react-hooks/exhaustive-deps' + "`r`n" + '  }, [storeId]); // Solo depender de storeId, no de fetchProducts para evitar bucles'

$content = $content -replace [regex]::Escape($oldPattern), $newPattern

# Guardar
Set-Content $file $content -NoNewline

Write-Host "✅ Cambio aplicado correctamente en useProducts.ts"
Write-Host "Dependencias del useEffect corregidas: solo [storeId]"
