# MoralesRoofPro Demo

GitHub Pages demo build for:

```text
moralesroofpro.moecommunitycloud.com
```

## Upload Instructions

Upload all files in this folder to the root of:

```text
moeblaze/moralesroofpro
```

GitHub repo should show:

```text
index.html
styles/
src/
assets/
CNAME
README.md
.nojekyll
```

## GitHub Pages Settings

Repo → Settings → Pages

- Source: Deploy from branch
- Branch: main
- Folder: /root
- Custom domain: moralesroofpro.moecommunitycloud.com

## DNS

Add this DNS record where moecommunitycloud.com is managed:

```text
Type: CNAME
Name: moralesroofpro
Value: moeblaze.github.io
```

## Google Maps

Open `index.html` and replace:

```text
YOUR_API_KEY
```

with the Google Maps API key when ready.
