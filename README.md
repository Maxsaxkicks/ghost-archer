# Ghost Archer (PWA)

タップした場所に矢を放ち、お化けを倒すミニゲーム。
- お化けはヒットで2体に分裂（1→2→4→8）
- お化けが下のプレイヤー領域に触れたらゲームオーバー

## Run
```bash
cd ~/clawdbot/projects/ghost-archer
python3 -m http.server 8080
# iPhone/iPad: 同一Wi-Fiで http://<MacのIP>:8080 を開く
```

## Notes
- Safariで「共有→ホーム画面に追加」で擬似アプリ化できます。
