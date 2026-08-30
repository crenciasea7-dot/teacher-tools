# ai-invest-tools 배포 복구 패치 적용 방법

이 패치는 `teacher-tools` 저장소의 `ai-invest-tools-master` 앱을 복구합니다.

## 포함된 수정

1. `pnpm-lock.yaml` 갱신
   - `package.json`에 추가된 `tesseract.js@^7.0.0`을 lockfile에 반영합니다.
   - Vercel의 `ERR_PNPM_OUTDATED_LOCKFILE` 오류를 해결합니다.

2. 스캔 PDF OCR fallback 추가
   - PDF 안의 텍스트 추출이 너무 짧으면 PDF 페이지를 이미지로 렌더링한 뒤 OCR을 실행합니다.
   - 스캔본/이미지형 PDF에서 “읽을 수 있는 본문이 너무 짧습니다.”가 뜨는 문제를 줄입니다.

## PC에서 적용

터미널에서 `teacher-tools` 저장소 폴더로 이동한 뒤 실행하세요.

```bash
git pull origin main
git am 0001-Update-ai-invest-lockfile-for-OCR-dependency.patch
git am 0002-Add-OCR-fallback-for-scanned-PDFs.patch
cd ai-invest-tools-master
pnpm install --frozen-lockfile
pnpm build
cd ..
git push origin main
```

## 배포 확인

`git push origin main`이 성공하면 Vercel의 `ai-invest-tools` 프로젝트가 자동으로 production 배포를 시작합니다.

확인할 URL:

- https://vercel.com/ahra1/ai-invest-tools
- https://ai-invest-tools-ahra1.vercel.app/

## 만약 git am에서 충돌이 나면

이미 일부 수정이 들어간 상태일 수 있습니다. 이 경우 아래 명령으로 중단한 뒤 다시 알려주세요.

```bash
git am --abort
```
