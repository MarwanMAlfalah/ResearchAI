"""Reusable Neo4j client for database connectivity and query execution."""

from __future__ import annotations

import logging
from typing import Any

from neo4j import GraphDatabase
from neo4j.exceptions import AuthError, Neo4jError, ServiceUnavailable

logger = logging.getLogger(__name__)


class Neo4jClientError(Exception):
    """Raised when Neo4j client operations fail."""


class Neo4jClient:
    """Thin wrapper around the Neo4j Python driver.

    This class centralizes connection lifecycle management and provides
    read/write helpers that can be reused by service modules.
    """

    def __init__(
        self,
        uri: str,
        username: str,
        password: str,
        database: str = "neo4j",
    ) -> None:
        self._uri = uri
        self._username = username
        self._password = password
        self._database = database
        self._driver = None

    def connect(self) -> None:
        """Create and verify the underlying Neo4j driver connection."""

        try:
            self._driver = GraphDatabase.driver(
                self._uri,
                auth=(self._username, self._password),
            )
            self._driver.verify_connectivity()
            logger.info("Connected to Neo4j", extra={"uri": self._uri, "database": self._database})
        except (AuthError, ServiceUnavailable, Neo4jError) as exc:
            logger.exception("Failed to connect to Neo4j")
            self._driver = None
            raise Neo4jClientError("Could not establish Neo4j connection") from exc

    def close(self) -> None:
        """Close the Neo4j driver if it is initialized."""

        if self._driver is None:
            return

        try:
            self._driver.close()
            logger.info("Closed Neo4j connection")
        except Neo4jError as exc:
            logger.exception("Error while closing Neo4j connection")
            raise Neo4jClientError("Could not close Neo4j connection cleanly") from exc
        finally:
            self._driver = None

    def verify_connectivity(self) -> None:
        """Verify that the current Neo4j connection is healthy."""

        driver = self._require_driver()

        try:
            driver.verify_connectivity()
        except (ServiceUnavailable, Neo4jError) as exc:
            logger.exception("Neo4j connectivity check failed")
            raise Neo4jClientError("Neo4j connectivity check failed") from exc

    def run_read_query(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """Run a read query and return records as dictionaries."""

        return self._run_query(query=query, parameters=parameters, database=database, write=False)

    def run_write_query(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
        database: str | None = None,
    ) -> list[dict[str, Any]]:
        """Run a write query and return records as dictionaries."""

        return self._run_query(query=query, parameters=parameters, database=database, write=True)

    def _run_query(
        self,
        query: str,
        parameters: dict[str, Any] | None,
        database: str | None,
        write: bool,
    ) -> list[dict[str, Any]]:
        """Execute a query in read or write mode."""

        driver = self._require_driver()
        target_db = database or self._database
        params = parameters or {}

        def execute(tx: Any) -> list[dict[str, Any]]:
            result = tx.run(query, params)
            return [record.data() for record in result]

        try:
            with driver.session(database=target_db) as session:
                if write:
                    return session.execute_write(execute)
                return session.execute_read(execute)
        except (ServiceUnavailable, Neo4jError) as exc:
            logger.exception(
                "Neo4j query execution failed",
                extra={"database": target_db, "write": write},
            )
            raise Neo4jClientError("Neo4j query execution failed") from exc

    def _require_driver(self) -> Any:
        """Return active driver or raise a clear error."""

        if self._driver is None:
            raise Neo4jClientError("Neo4j driver is not initialized. Call connect() first.")
        return self._driver
