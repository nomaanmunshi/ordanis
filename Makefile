.PHONY: test backend-test frontend-test frontend-build up down

test: backend-test frontend-test
backend-test:
	./gradlew clean test
frontend-test:
	cd ordanis-console && npm test
frontend-build:
	cd ordanis-console && npm run build
up:
	docker compose up --build
down:
	docker compose down
