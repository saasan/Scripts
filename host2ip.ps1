# 入力するファイル名
# 1行に1つホスト名を書いておく
$hosts = 'host2ip.txt'
# 出力するファイル名
$output = 'host2ip.csv'

$date = Get-Date -format g
Set-Content $output "Date,$date"

foreach ($h in gc $hosts) {
  try {
    $ip = [Net.Dns]::GetHostAddresses($h).IPAddressToString[1]
  }
  catch [System.Net.Sockets.SocketException] {
    $ip = "server can't find $h"
  }
  finally {
    "$h,$ip"
    Add-Content $output "$h,$ip"
  }
}
