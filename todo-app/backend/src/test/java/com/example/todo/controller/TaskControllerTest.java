package com.example.todo.controller;

import com.example.todo.repository.TaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"})
class TaskControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private TaskRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    private long createTask(String json) throws Exception {
        String body = mvc.perform(post("/api/tasks").contentType(APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return new ObjectMapper().readTree(body).get("id").asLong();
    }

    @Test
    void createTask_returnsCreatedTaskWithDefaults() throws Exception {
        mvc.perform(post("/api/tasks").contentType(APPLICATION_JSON)
                        .content("{\"title\":\"Write report\",\"deadline\":\"2099-01-01\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Write report"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.overdue").value(false));
    }

    @Test
    void createTask_withEmptyTitle_returns400() throws Exception {
        mvc.perform(post("/api/tasks").contentType(APPLICATION_JSON).content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Title cannot be empty"));
    }

    @Test
    void getUpdateDelete_workAndMissingTaskReturns404() throws Exception {
        long id = createTask("{\"title\":\"Old\"}");

        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isOk());

        mvc.perform(put("/api/tasks/" + id).contentType(APPLICATION_JSON)
                        .content("{\"title\":\"New\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New"))
                .andExpect(jsonPath("$.priority").value("HIGH"));

        mvc.perform(delete("/api/tasks/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/tasks/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void patchStatus_andFilterByStatus() throws Exception {
        long id = createTask("{\"title\":\"A\"}");
        createTask("{\"title\":\"B\"}");

        mvc.perform(patch("/api/tasks/" + id + "/status").contentType(APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        mvc.perform(get("/api/tasks")).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/tasks?status=COMPLETED")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/tasks?status=PENDING")).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void search_findsTaskByTitleIgnoringCase() throws Exception {
        createTask("{\"title\":\"Buy groceries\"}");
        createTask("{\"title\":\"Call mom\"}");

        mvc.perform(get("/api/tasks?search=GROC"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Buy groceries"));
    }

    @Test
    void overdueFlag_isTrueForPastPendingTask() throws Exception {
        createTask("{\"title\":\"Late\",\"deadline\":\"2020-01-01\"}");

        mvc.perform(get("/api/tasks"))
                .andExpect(jsonPath("$[0].overdue").value(true));
    }
}
