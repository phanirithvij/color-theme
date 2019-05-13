# Learnings

This doc contains all the bugs encountered while developing this piece of junk

Along with some new stuff that I might google again and again.

## Issues
+ Sqlite3 installation Windows
    - **Issue** : In windows sqlite3 wasn't in-built when I was using `python 3.7.3`
    - **Solution**

        ```shell
        python -m pip install pysqlite3
        ```

        from [this stackoverflow post](https://stackoverflow.com/a/51031104/8608146)
    - **Tags** : sqlite3, install, windows, pip, python

+ Importing from parent directory python
    - **Issue** : importing from upper directories in python is a pain
    - **Solution** : Don't do it
    - **Tags** : python, import

+ SQlite3 same thread error
    - **Issue** : sqlite3.ProgrammingError: SQLite objects created in a thread can only be used in that same thread. The object was created in thread id 24440 and this is thread id 17404.
    - **Solution** :

        ```python
        # Use a seperate connection object in every function instead of passing it as an argument like
        # [#447d3b] is the CTRL + K + V [preview] comment's green color
        import sqlite3
        conn = sqlite3.connect(db_name)
        cur = conn.cursor()
        # Don't do it globally
        # do it once in a file
        ```
    - **Tags** : sqlite3, python

+ Using f-strings in sql
    - **Learning** : Using `f"{data}"` f-strings in sql is bad as it eases sql injection.
    - **Solution** :

        Use the provided way i.e use `?`s.
        ```python
        import sqlite3
        sql_query = """
        INSERT INTO table (name, blah, blah2) VALUES (?, ?, ?)
        """
        conn = sqlite3.connect("db.db")
        c = conn.cursor()

        c.execute(sql_squery, ("blah", "blah", "blah"))
        ```
    - **Tags** : sqlite3, sql, python

+ Flask 404
    - **Learning** : To send a custom 404 python, flask
    - **Solution** :

        Following [this answer from stackoverflow](https://stackoverflow.com/a/29516120/8608146)
        ```python
        @app.route("/<filename>")
            if not get_file(filename):
                return "hello this is a <b>404</b>", 404
        ```
    - **Tags** : flask, 404, python
