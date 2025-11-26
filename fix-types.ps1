# Fix all remaining implicit any type errors
$files = @(
    @{Path="src/app/api/users/route.ts"; Line=24; Old=".map(u =>"; New=".map((u: any) =>"},
    @{Path="src/app/api/warehouses/route.ts"; Line=22; Old=".map(w =>"; New=".map((w: any) =>"},
    @{Path="src/app/api/sales/route.ts"; Line=44; Old=".map(sale =>"; New=".map((sale: any) =>"},
    @{Path="src/app/api/orders/route.ts"; Line=120; Old=".map(order =>"; New=".map((order: any) =>"},
    @{Path="src/app/api/costumers/route.ts"; Line=44; Old=".map(customer =>"; New=".map((customer: any) =>"},
    @{Path="src/app/api/credits/summary/route.ts"; Line=157; Old=".map(acc =>"; New=".map((acc: any) =>"}
)

foreach ($file in $files) {
    $filePath = Join-Path "c:\app\tiendafacil" $file.Path
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $content = $content -replace [regex]::Escape($file.Old), $file.New
        Set-Content $filePath $content -NoNewline
        Write-Host "Fixed: $($file.Path)"
    }
}
