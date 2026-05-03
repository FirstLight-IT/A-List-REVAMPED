from Website import getApp, db
from flask import render_template

app = getApp()

#creating the database
#with app.app_context():
#   db.create_all()


if __name__ == '__main__':
    app.run(debug=True)