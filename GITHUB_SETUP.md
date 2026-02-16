# 📤 Инструкция по загрузке на GitHub

## Шаг 1: Установить Git

### Windows
1. Откройте https://git-scm.com/download/win
2. Скачайте и установите Git for Windows
3. Перезагрузитесь

### macOS
```bash
brew install git
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install git
```

### Проверка установки
```bash
git --version
```

---

## Шаг 2: Создать репозиторий на GitHub

1. Откройте https://github.com/new
2. Введите имя репозитория: `chess-helper`
3. Описание: "Полнофункциональное шахматное приложение с поддержкой мультиплеера и ИИ"
4. Выберите "Public" или "Private"
5. НЕ выбирайте "Initialize this repository with:"
6. Нажмите "Create repository"

---

## Шаг 3: Инициализировать локальный репозиторий

Откройте PowerShell/Terminal в папке проекта:

```bash
cd c:\Users\user\Desktop\assist
```

Инициализируйте git:
```bash
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## Шаг 4: Добавить файлы

```bash
git add .
```

Проверить статус:
```bash
git status
```

---

## Шаг 5: Первый коммит

```bash
git commit -m "Initial commit: Chess helper v2.0 with friends and online games"
```

---

## Шаг 6: Добавить GitHub как remote

Замените `YOUR_USERNAME` на ваш GitHub username:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chess-helper.git
```

---

## Шаг 7: Залить на GitHub

```bash
git push -u origin main
```

При первом запуске может потребоваться ввести:
- GitHub username
- GitHub Personal Access Token (вместо пароля)

### Как получить Personal Access Token:

1. Откройте https://github.com/settings/tokens
2. Нажмите "Generate new token"
3. Дайте название: "Chess Helper Upload"
4. Выберите область: `repo` (full control of private repositories)
5. Нажмите "Generate token"
6. Скопируйте токен (он больше не будет видимым!)
7. Используйте как пароль при загрузке

---

## Шаг 8: Проверить на GitHub

1. Откройте https://github.com/YOUR_USERNAME/chess-helper
2. Вы должны увидеть все ваши файлы
3. Откройте `github_README.md` - это главная страница репо

---

## Полный скрипт (копируйте и выполняйте)

```bash
# Перейти в папку проекта
cd c:\Users\user\Desktop\assist

# Инициализировать git
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Добавить файлы
git add .

# Первый коммит
git commit -m "Initial commit: Chess helper v2.0 with friends and online games"

# Добавить remote (замените YOUR_USERNAME)
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chess-helper.git

# Залить на GitHub
git push -u origin main
```

---

## Дальнейшие обновления

После первой загрузки, для обновления файлов:

```bash
# Проверить что изменилось
git status

# Добавить изменения
git add .

# Закоммитить
git commit -m "Описание изменений"

# Загрузить на GitHub
git push
```

---

## 🔗 Полезные ссылки

- **GitHub**: https://github.com
- **Git Documentation**: https://git-scm.com/doc
- **Personal Access Token**: https://github.com/settings/tokens
- **GitHub Help**: https://docs.github.com

---

## ❓ Частые проблемы

### "git: command not found"
**Решение**: Git не установлен. Установите его с https://git-scm.com

### "fatal: not a git repository"
**Решение**: Выполните `git init` в папке проекта

### "fatal: remote origin already exists"
**Решение**: Выполните `git remote remove origin` и добавьте заново

### "Authentication failed"
**Решение**: Используйте Personal Access Token вместо пароля

### "Please tell me who you are"
**Решение**: Выполните:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## ✅ Готово!

После следования этим инструкциям ваш проект будет на GitHub и готов к совместной разработке!

