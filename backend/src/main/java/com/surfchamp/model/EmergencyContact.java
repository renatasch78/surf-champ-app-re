package com.surfchamp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Data
@Embeddable
public class EmergencyContact {
    
    @Column(name = "emergency_contact_name", length = 100)
    private String name;
    
    @Column(name = "emergency_contact_phone", length = 20)
    private String phoneNumber;
    
    @Column(name = "emergency_contact_relationship", length = 50)
    private String relationship;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }
}
