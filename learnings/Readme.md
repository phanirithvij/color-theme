# Learnings

This doc contains all the bugs encountered while developing this piece of junk

## Issues
+ Sqlite3 installation Windows
    - **Issue** : In windows sqlite3 wasn't in build when I was using `python 3.7.3`
    - **Solution**

        ```shell
        python -m pip install pysqlite3
        ```

        from [this stackoverflow post](https://stackoverflow.com/a/51031104/8608146)

+ Importing from parent directory python
    - **Issue** : importing from upper directories in python is a pain
    - **Solution** : Don't do it

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
+ Using f-strings in sql
    - **Issue** : Using `f"{data}"` f-strings in sql is bad as it eases sql injection.
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