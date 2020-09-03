#!/usr/bin/env sh

# 当发生错误时中止脚本
set -e

# 构建
npm run build

# cd 到构建输出的目录下
cd public

git init
git add -A
git commit -m 'deploy'

# 部署到 https://jjjj4564.github.io/jjjj4564.github.io
git push -f git@github.com:jjjj4564/jjjj4564.github.io.git master:gh-pages

cd -
