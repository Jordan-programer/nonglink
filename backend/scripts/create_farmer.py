"""Create (or verify/update) a verified farmer user.

Can be run interactively or with command-line arguments:
    cd backend && python scripts/create_farmer.py
    cd backend && python scripts/create_farmer.py --email agricultor@agrilink.store --name "Manuel Agricultor" --password "SenhaForte123!" --phone "+244923456789" --with-farm

Or inside Docker:
    docker exec -it nonglink-backend python3 scripts/create_farmer.py
"""
import argparse
import getpass
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
import app.models
from app.models.user import User, UserRole
from app.models.region import Region
from app.models.farm import Farm
from app.utils.security import hash_password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Criar utilizador agricultor verificado no NongLink.")
    parser.add_argument("--email", type=str, help="Email do agricultor")
    parser.add_argument("--name", type=str, help="Nome completo")
    parser.add_argument("--password", type=str, help="Palavra-passe")
    parser.add_argument("--phone", type=str, help="Telefone (opcional)")
    parser.add_argument("--region-id", type=int, help="ID da região (opcional)")
    parser.add_argument("--with-farm", action="store_true", help="Criar automaticamente uma parcela inicial de teste")
    parser.add_argument("--farm-name", type=str, default="Lavra Esperança", help="Nome da parcela inicial")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db = SessionLocal()

    try:
        # 1. Email
        email = args.email.strip().lower() if args.email else input("Email do agricultor: ").strip().lower()
        if not email:
            print("Erro: O email é obrigatório.", file=sys.stderr)
            sys.exit(1)

        existing = db.query(User).filter(User.email == email).first()

        # 2. Região disponível
        regioes = db.query(Region).order_by(Region.id).all()
        region_id = args.region_id
        if not region_id:
            if existing and existing.region_id:
                region_id = existing.region_id
            elif regioes:
                region_id = regioes[0].id

        if existing:
            print(f"Utilizador '{email}' já existe (ID #{existing.id}). Actualizando para agricultor verificado...")
            existing.role = UserRole.FARMER
            existing.is_active = True
            existing.email_verified = True
            if region_id and not existing.region_id:
                existing.region_id = region_id
            if args.phone:
                existing.phone = args.phone.strip()

            if args.password:
                existing.hashed_password = hash_password(args.password)

            db.commit()
            db.refresh(existing)
            user = existing
            print(f"✓ Utilizador '{email}' actualizado com sucesso: role=farmer, email_verified=True, is_active=True.")
        else:
            name = args.name.strip() if args.name else input("Nome completo: ").strip()
            if not name:
                name = "Agricultor NongLink"

            phone = args.phone.strip() if args.phone else input("Telefone (opcional, Enter para ignorar): ").strip() or None

            password = args.password
            if not password:
                password = getpass.getpass("Palavra-passe: ")
                confirm = getpass.getpass("Confirmar palavra-passe: ")
                if password != confirm:
                    print("Erro: As palavras-passe não coincidem.", file=sys.stderr)
                    sys.exit(1)

            if not password:
                print("Erro: A palavra-passe não pode estar vazia.", file=sys.stderr)
                sys.exit(1)

            user = User(
                name=name,
                email=email,
                phone=phone,
                hashed_password=hash_password(password),
                role=UserRole.FARMER,
                is_active=True,
                email_verified=True,
                region_id=region_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✓ Agricultor verificado '{email}' criado com sucesso (ID #{user.id}).")

        # 3. Criar parcela/fazenda de teste se solicitado ou se o agricultor não tiver nenhuma
        has_farm = db.query(Farm).filter(Farm.owner_id == user.id).first()
        should_create_farm = args.with_farm
        if not has_farm and not args.with_farm and not args.email:
            ans = input(f"Deseja criar uma parcela inicial ('{args.farm_name}') para este agricultor? (s/n): ").strip().lower()
            if ans in ("s", "sim", "y", "yes"):
                should_create_farm = True

        if should_create_farm and not has_farm:
            sample_boundary = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [13.234, -8.838],
                        [13.240, -8.838],
                        [13.240, -8.845],
                        [13.234, -8.845],
                        [13.234, -8.838]
                    ]
                ]
            }
            farm = Farm(
                name=args.farm_name,
                owner_id=user.id,
                region_id=user.region_id,
                location="Caxito / Bengo",
                latitude=-8.8415,
                longitude=13.2370,
                size_hectares=12.5,
                boundary_geojson=json.dumps(sample_boundary),
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)
            print(f"✓ Parcela inicial '{farm.name}' (ID #{farm.id}) criada com polígono de satélite para testes.")
        elif has_farm:
            print(f"ℹ O agricultor já possui parcela: '{has_farm.name}' (ID #{has_farm.id}).")

        print("\n--- Resumo do Agricultor ---")
        print(f"ID: {user.id}")
        print(f"Nome: {user.name}")
        print(f"Email: {user.email}")
        print(f"Telefone: {user.phone or 'N/A'}")
        print(f"Role: {user.role.value if hasattr(user.role, 'value') else user.role}")
        print(f"Verificado: {user.email_verified}")
        print(f"Activo: {user.is_active}")
        print(f"Região ID: {user.region_id}")

    finally:
        db.close()


if __name__ == "__main__":
    main()

