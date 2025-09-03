import React from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Placeholder page for New Lot for Tax Declaration module.
 * No backend calls yet; just an empty state to avoid confusion.
 */
export default function NewLotForTaxDeclaration() {
  return (
    <div className="container mt-4">
      <h2 className="mb-3">New Lot for Tax Declaration</h2>

      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Coming Soon</Card.Title>
          <Card.Text className="text-muted">
            This module will handle requests for registering{" "}
            <strong>new lots for tax declaration</strong> (e.g., lot details,
            ownership documents, tax references, and supporting files). For now,
            this is a placeholder so users see it as a dedicated section.
          </Card.Text>
          <div className="d-flex gap-2">
            <Button variant="secondary" disabled>
              Register New Lot (disabled)
            </Button>
            <Button variant="outline-secondary" disabled>
              View Guidelines (disabled)
            </Button>
          </div>
        </Card.Body>
      </Card>

      <p className="text-muted">
        Tip: While this module is being prepared, users can still manage
        existing <strong>Land Parcels</strong> or check{" "}
        <strong>Property Records</strong> for reference.
      </p>
    </div>
  );
}
