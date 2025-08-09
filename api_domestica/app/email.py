import smtplib
from email.message import EmailMessage

def enviar_email_recuperacao(destinatario: str, token: str):
    remetente = "seuemail@gmail.com"
    senha_app = "sua-senha-de-aplicativo"
    
    msg = EmailMessage()
    msg['Subject'] = 'Recuperação de Senha'
    msg['From'] = remetente
    msg['To'] = destinatario

    link_recuperacao = f"https://sua-aplicacao.com/resetar-senha?token={token}"
    
    corpo = f"""
    Olá,

    Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para continuar:

    {link_recuperacao}

    Se você não solicitou isso, apenas ignore este e-mail.
    """

    msg.set_content(corpo)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(remetente, senha_app)
        smtp.send_message(msg)

    print("E-mail de recuperação enviado com sucesso.")
